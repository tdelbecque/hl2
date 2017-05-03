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
import Data.ByteString (ByteString)

import Control.Monad
import Control.Applicative
import Data.Text.Lazy (unpack)

import Text.Regex.Posix
import Data.Typeable
import Control.Exception

import Data.Time (getCurrentTime)

import Network.HTTP (simpleHTTP, getRequest, getResponseBody)
    
               
resourcesDir = "resources"

responseFile :: String -> String -> ServerPart Response
responseFile head seg = do
  --let completePath = head </> seg
  let completePath = "resources/wip.jpeg"
  test <- liftIO (doesFileExist completePath)
  if test then
      serveDirectory DisableBrowsing [] completePath
  else do
    test <- liftIO $ doesDirectoryExist completePath
    if test then
        path $ \(x :: String) -> responseFile completePath x
    else do
      serveDirectory DisableBrowsing [] completePath
         
resource :: ServerPart Response
resource = path $ \(x::String) -> responseFile resourcesDir x

main :: IO ()
main = do
  mainPage <- readFile "resources/wip.html"
  serve Nothing $ do
         msum [
             dir "img" $ resource,
             do
               setHeaderM "content-type" "text/html"
               ok $ toResponse mainPage
            ]

