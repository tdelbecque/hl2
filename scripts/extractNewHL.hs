-- Extract the HL that have not been parsed yet

{-# LANGUAGE DeriveDataTypeable #-}
{-# LANGUAGE BangPatterns #-}

import System.IO
import Data.Typeable
import Control.Exception
import System.Environment
import System.Directory (doesDirectoryExist, doesFileExist,
                                           getDirectoryContents)
import System.FilePath ((</>))
import Control.Monad
import Text.Regex.PCRE
import qualified Data.Set as DS
    
newtype PII = PII {value :: String}
    deriving (Ord, Eq, Show)
             
type SetOfPII = DS.Set PII
    
data MyException = MyException String
                 deriving (Show, Typeable)
instance Exception MyException

croak = hPrint stderr

croakNotDir x = croak $ "Not a directory : " ++ x
throwNotDir = throw $ MyException "Not a directory"

fileList :: FilePath -> IO [FilePath]
fileList d = (liftM (map (d </>)) $ getDirectoryContents d)
             >>= (filterM doesFileExist)

loadOne :: FilePath -> IO SetOfPII
loadOne f =
    withFile f ReadMode $ \ h -> do
      let loop acc = do
            eof <- hIsEOF h
            if eof then return acc
            else do
              l <- hGetLine h
              let !acc' = case l =~ "^1\tS(?:X|\\d){16}" :: String of
                           "" -> acc
                           _:_:x -> DS.insert (PII x) acc
              loop acc'
      let x = loop DS.empty
      --y <- x
      --print $ map value y
      x
      
loadParsedPII :: [FilePath] -> IO SetOfPII
loadParsedPII [] = return DS.empty
loadParsedPII (h:t) = liftM2 DS.union (loadOne h) (loadParsedPII t)

filterHL :: [String] -> SetOfPII -> IO ()
filterHL xs piis = loop xs where
    loop (f:t) = do
      withFile f ReadMode $ \ h ->
          do
            let loopLine = do
                   eof <- hIsEOF h
                   when (not eof) $ do
                             l <- hGetLine h
                             case l =~ "^(S(?:X|\\d){16}).{10}" :: [[String]] of
                               [] -> return ()
                               ([_,pii]:_) -> when (DS.notMember (PII pii) piis) $ putStrLn l
                               x -> error ("Should never occur: " ++ (show x))
                             loopLine
            loopLine
      loop t
    loop _ = return ()
                      
main :: IO ()
main = do
  args <- getArgs
  when (length args /= 2) $ do
         progname <- getProgName
         croak $ progname ++ " hl_dir parser_dir"
         throw $ MyException "Bad command line"
  let [pathHLDir, pathParserDir] = args 
  existsHLDir <- doesDirectoryExist pathHLDir
  existsParserDir <- doesDirectoryExist pathParserDir
  when (not existsHLDir) $ do
         croakNotDir pathHLDir
         throwNotDir
  when (not existsParserDir) $ do
         croakNotDir pathParserDir
         throwNotDir

  filesParser <- fileList pathParserDir
  filesHL <- fileList pathHLDir

  -- load the piis of papers that have already been parsed
  when (length filesHL > 0) $ do
         piis <- loadParsedPII filesParser
         filterHL filesHL piis
         -- print $ DS.size piis

  return ()
  --print $ map value piis
