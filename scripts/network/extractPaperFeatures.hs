import System.Environment
import Control.Applicative
import Text.XML.HXT.Parser.XmlParsec
import Text.XML.HXT.XPath.XPathEval
import Text.XML.HXT.DOM.FormatXmlTree
import Text.XML.HXT.DOM.TypeDefs
import Data.Tree.NTree.TypeDefs
import Text.Regex.PCRE
    
newtype Pii      = Pii String      deriving (Show, Read, Eq)
newtype Title    = Title String    deriving (Show, Read, Eq)
newtype Issn     = Issn String     deriving (Show, Read, Eq)
newtype Abstract = Abstract String deriving (Show, Read, Eq)
newtype PubTime  = PubTime String deriving (Show, Read, Eq)
newtype FirstPage = FirstPage String deriving (Show, Read, Eq)
newtype LastPage = LastPage String deriving (Show, Read, Eq)
newtype Volume = Volume String deriving (Show, Read, Eq)
    
data Fields = Fields {
      pii      :: Pii,
      title    :: Title,
      issn     :: Issn,
      abstract :: Abstract,
      pubTime  :: Maybe PubTime,
      firstPage :: Maybe FirstPage,
      lastPage :: Maybe LastPage,
      volume :: Maybe Volume
    } deriving (Show, Read, Eq)

maybeTextContent :: XmlTree -> Maybe String
maybeTextContent (NTree (XText d) _) = Just d
maybeTextContent _ = Nothing

maybeHead :: [a] -> Maybe a
maybeHead (x:_ ) = Just x
maybeHead _ = Nothing

getValue :: XmlTree -> String -> Maybe String
getValue t p = (maybeHead $ getXPathWithNsEnv ns p t) >>= maybeTextContent
    where ns = [("dc", "http://purl.org/dc/elements/1.1/"),
                ("prism", "http://prismstandard.org/namespaces/basic/2.0/"),
                ("xocs", "http://www.elsevier.com/xml/xocs/dtd")]

defaultTo :: a -> (Maybe a) -> (Maybe a)
defaultTo x Nothing = Just x
defaultTo _ y = y
                
readFields :: String -> IO (Maybe Fields)
readFields file = do
  let piiXPath      = "//*[local-name()='pii']//text()"
      titleXPath    = "//*[name()=\"dc:title\"]//text()"
      issnXPath     = "//*[name()=\"prism:issn\"]//text()"
      abstractXPath = "//*[name()=\"dc:description\"]//text()"
      pubTimeXPath  = "//*[name()=\"prism:coverDate\"]//text()"
      firstPageXPath = "//*[name()=\"xocs:first-page\"]//text()"
      lastPageXPath = "//*[name()=\"xocs:last-page\"]//text()"
      volumeXPath = "//*[name()=\"xocs:vol-iss-suppl-text\"]//text()"
  putStrLn =<< (fmap (++ file) $ getEnv "HLDATADIR")
  fn <- fmap (++ file) $ getEnv "HLDATADIR"
  content <- readFile fn
  let accessor = getValue . head $ xread content
      pii      = Pii      <$> (fmap cleanpii $ accessor piiXPath)
                 where cleanpii pii = foldr (\ v acc -> (head v) ++ acc) "" $
                                      pii =~ "[SX0-9]+"
      title    = Title    <$> accessor titleXPath
      issn     = Issn     <$> accessor issnXPath
      abstract = Abstract <$> accessor abstractXPath
      pubTime  = Just $ PubTime <$>  accessor pubTimeXPath
      firstPage = Just $ FirstPage <$> accessor firstPageXPath
      lastPage = Just $ LastPage <$> accessor lastPageXPath
      volume = Just $ Volume <$> accessor volumeXPath
  return $ Fields <$> pii <*> title <*> issn <*> abstract <*>
                  pubTime <*> firstPage <*> lastPage <*> volume

main :: IO ()
main =
    (=<<) putStrLn $ fmap show $ readFields "/out/pages-xml/S037596011730292X.xml"

