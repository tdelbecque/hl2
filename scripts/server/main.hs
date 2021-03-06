{-# LANGUAGE OverloadedStrings, ScopedTypeVariables, DeriveDataTypeable #-}

import GHC.Exts
import Happstack.Lite
import Text.Blaze.Html5 (toHtml)
import System.FilePath
import Control.Monad.IO.Class
import System.Directory
import System.FilePath ((</>))
import System.IO (hPutStrLn, stderr)
import Database.PostgreSQL.Simple
import Data.ByteString (ByteString, unpack)

import Control.Monad
import Control.Applicative
import qualified Data.Text.Lazy as LazyText (unpack)

import Text.Regex.Posix
import Data.Typeable
import Control.Exception

import Data.Time (getCurrentTime)

import Network.HTTP (simpleHTTP, getRequest, getResponseBody)
import Network.HTTP.Types.URI (urlEncode)
import Data.ByteString.UTF8 (toString)
    
type S = String

data MyException = MyException String
                 deriving (Show, Typeable)
instance Exception MyException

type Exceptional a = Either MyException a
    
newtype Pii = Pii {piiAsString :: String}
         deriving (Ord, Eq, Show)
instance IsString Pii where
    fromString s = f s where
        f | piiPCREPatternMatch s = Pii
          | otherwise = errorNotAValidPii

croak = hPutStrLn stderr
timedCroak :: String -> IO ()
timedCroak msg = do
  t <- getCurrentTime
  croak $ (show t) ++ " : " ++ msg
        
piiPCREPatternMatch :: String -> Bool
piiPCREPatternMatch x = x =~ ("S(X|[0-9]){16}"::String)

notAValidPiiMsg :: String -> String
notAValidPiiMsg = ("This is not a valid pii : " ++)
                  
errorNotAValidPii x = error $ notAValidPiiMsg x 

getMaybePii :: String -> Maybe Pii
getMaybePii s | piiPCREPatternMatch s = Just $ Pii s
              | otherwise = Nothing

getExceptionalPii :: String -> Exceptional Pii
getExceptionalPii s | piiPCREPatternMatch s = Right $ Pii s
                    | otherwise = Left $ MyException $ notAValidPiiMsg s

data PaperLoad = PaperLoad {
      pii :: Pii, 
      issn :: String,
      title :: String,
      authors :: String,
      abstract :: String,
      volume :: String,
      pages :: String,
      pubtime :: String,
      journalTitle :: String,
      hl :: String
      } deriving (Eq, Show)
               
resourcesDir = "resources"

responseFile :: String -> String -> ServerPart Response
responseFile head seg = do
  let completePath = head </> seg
  test <- liftIO (doesFileExist completePath)
  if test then
      serveDirectory DisableBrowsing [] completePath
  else do
    test <- liftIO $ doesDirectoryExist completePath
    if test then
        path $ \(x :: String) -> responseFile completePath x
    else do
      liftIO $ croak $ "Unable to find : " ++ completePath
      notFound $ toResponse completePath
         
resource :: ServerPart Response
resource = path $ \(x::String) -> responseFile resourcesDir x

resourceFallback :: ServerPart Response
resourceFallback = notFound $ toResponse ()

-- queryLoad loads paper info for a given pii

queryLoad :: Connection -> Pii -> IO (Maybe PaperLoad)
queryLoad conn pii = do
  let queryString  = "select a.issn, a.title, a.authors, a.abstract, a.volume, a.pages, a.pubtime, coalesce (b.journal_title, '') from articles a left outer join journals_title b on a.issn = b.issn  where pii = ?"
  let qpii = Only $ piiAsString pii
  let queryForHL :: IO [Only String] = query conn  "select hl from xml_hl where pii = ?" qpii
  let queryForData :: IO [(S,S,S,S,S,S,S,S)] = query conn queryString qpii

  hl <- queryForHL
  case hl of
    [] -> return Nothing
    [Only hl] ->
        do xdata <- queryForData
           case xdata of
             [] -> return Nothing
             [(issn, title, authors, abstract, volume, pages, pubtime, journalTitle)] ->
                 return $ Just $ PaperLoad {
                              pii = pii,
                              issn = issn,
                              title = title,
                              authors = authors,
                              abstract = abstract,
                              volume = volume,
                              pages = pages,
                              pubtime = pubtime,
                              journalTitle = journalTitle,
                              hl = hl
                    }
             _ -> error "Error"
    _ -> error "More than one found"

getResponseMissingPii = notFound $ toResponse ("Missing Pii" :: String)
getResponseMalFormedPii = notFound $ toResponse ("Malformed Pii" :: String)
getResponseNothingForThisPii = notFound $ toResponse ("Nothing for this Pii" :: String)

replaceAll :: String -> String -> String -> String
replaceAll what with txt = f txt where
    f "" = ""
    f x = a ++ with ++ f b where
        (a, _, b) = x =~ what :: (String, String, String)

preparePage :: String -> PaperLoad -> String
preparePage page load =
    let f _ "" txt = txt
        f what with txt = replaceAll what with txt
        replaceHL = f "__HIGHLIGHTS__" (hl load) page
        replaceTitle = f "__TITLE__" (title load) replaceHL
        replaceISSN = f "--ISSN__" (issn load) replaceTitle
        replaceAbstract = f "__ABSTRACT__" (abstract load) replaceISSN
        replaceVolume = f "__VOLUME__" (volume load) replaceAbstract
        replacePages = f "__PAGES__" (pages load) replaceVolume
        replacePubtime = f "__PUBTIME__" (pubtime load) replacePages
        replaceJournal = f "__JOURNAL__" (journalTitle load) replacePubtime
    in replaceJournal
                            
            
getServerPartResponseForPii :: String -> Connection -> Pii -> ServerPart Response
getServerPartResponseForPii page conn pii = do
  load <- liftIO $ queryLoad  conn pii
  case load of
    Nothing -> getResponseNothingForThisPii
    Just x -> do
              setHeaderM "content-type" "text/html"
              ok $ toResponse $ preparePage page x
     
paper :: String -> Connection -> ServerPart Response
paper page conn = do
  maybePii <- optional $ lookText "pii"
  liftIO $ timedCroak $ show (fmap LazyText.unpack maybePii)
  case maybePii of
    Nothing -> getResponseMissingPii
    Just piiLazyStr -> response where
                epii = getExceptionalPii $ LazyText.unpack piiLazyStr
                response = case epii of
                             Left e -> getResponseMalFormedPii
                             Right pii -> getServerPartResponseForPii page conn pii

main :: IO ()
main = do
  mainPaperPagePattern <- readFile "resources/page.html"
  let connectString :: ByteString = "postgres://cg:cg@localhost/cg"
  conn <- connectPostgreSQL connectString
  let config = Just $ ServerConfig {
                 port=8001,
                 ramQuota = 10 * 10^6,
                 diskQuota = 200 * 10^6,
                 tmpDir = "/tmp/"
               }
  serve config $ do
         method [GET]
         msum [ dir "resources" $ resource,
                dir "resources" $ resourceFallback,
                dir "paper" $ paper mainPaperPagePattern conn,
                dir "test" $ do
                  setHeaderM "content-type" "text/html"
                  ok $ toResponse mainPaperPagePattern,
                dir "query" $ do
                  let queryUrl :: String = toString $ urlEncode False "q=cancer du %2Bcul"
                  x <- liftIO $ simpleHTTP (getRequest $ "http://localhost:9000/query?" ++ queryUrl)
                  let y = getResponseBody x
                  contentType <- getHeaderM ("content-type")
                  setHeaderM "content-type" "text/xml"
                  liftIO $ putStrLn $ "contentType : " ++ show contentType
                  z :: String <- liftIO y
                  ok $ toResponse z
              ]
