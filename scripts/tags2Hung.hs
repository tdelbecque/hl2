{-# LANGUAGE DeriveDataTypeable #-}

import System.IO
import Data.Typeable
import Control.Exception
import TreeTagger
import Text.Regex.PCRE

splitOnElt :: Eq a => a -> [a] -> [[a]]
splitOnElt sep x = foldr f [[]] x where
    f c a | c == sep = [] : a
          | True = (c : (head a)) : (tail a)

replaceElt :: Eq a => a -> [a] -> [a] -> [a]
replaceElt elt repl xs = foldr f [] xs where
    f c a | c == elt = repl ++ a
          | True = c : a

data MyException = MyException String
                 deriving (Show, Typeable)
instance Exception MyException
    
type T = (String, String, String, [String])

newtype PII = PII String
    deriving (Show, Eq)

data State = State PII Int String
           | StateEndHL PII Int String
           | StateExpectPaper
           | StateExpectHL PII Int
           deriving (Show)
                    
extractPii :: String -> PII
extractPii x = PII pii
    where (_, _, _, [pii]) = x =~ (".+(" ++ piiRE ++ ")") :: T

             
data Tok = Tok {
      term_ :: String,
      lemma_ :: String,
      pos_ :: PoS,
      cl_ :: String}
         deriving (Show, Eq)
                                            
piiRE = "S(?:X|\\d){16}"
        
isBeginingOfPaper :: String -> Bool
isBeginingOfPaper x = 
    x =~ ("^\\s*<\\s*PAPER\\s+PII\\s*=\\s*\"" ++ piiRE ++ "\"\\s*>")

isEndOfPaper :: String -> Bool
isEndOfPaper x = x =~ "^</PAPER>"

isBeginingOfHL :: String -> Bool
isBeginingOfHL x = x =~ "^\\s*<HL>\\s*$"
                   
isEndOfHL :: String -> Bool
isEndOfHL x = x =~ "^\\s*</HL>\\s*$"

isBeginingOfTag :: String -> Bool
isBeginingOfTag x = x =~ "^\\s*<[^/].+>\\s*$"

isEndOfTag :: String -> Bool
isEndOfTag x = x =~ "^\\s*</.+>\\s*$"

extractToken :: String -> Maybe Tok
extractToken x = m
    where l = splitOnElt '\t' x
          --    where l = x =~ "[^\\t]+" :: [[String]]
          m = case l of
                [tok, pos, lem, tokno, cl] -> do
                       p <- strToPos pos
                       return $ Tok tok lem p cl
                _ -> Nothing

doLine :: String -> State -> State
doLine x StateExpectPaper 
    | isBeginingOfPaper x = StateExpectHL (extractPii x) 1
    | otherwise = throw $ MyException $ "Expected a paper, found " ++ x

doLine x (StateExpectHL pii hlno)
       | isBeginingOfHL x = State pii hlno ""
       | isEndOfPaper x = StateExpectPaper
       | otherwise = throw $ MyException $ "Expected an HL, found " ++ x

doLine x s @ (State pii hlno str)
       | (isBeginingOfPaper x) || (isBeginingOfHL x) || (isEndOfPaper x)
         = throw $ MyException $ errMsg ++ x
       | isEndOfHL x = StateEndHL pii hlno str
       | (isBeginingOfTag x) || (isEndOfTag x) = s
       | otherwise = case extractToken x of
                       Nothing -> throw $ MyException $ errMsg ++ x 
                       Just t -> nextState s t
       where errMsg = "Expected a token, found "

escapeChar0 :: String -> String
escapeChar0 str = foldr (\ x l -> x ++ l) "" l
    where l = [a ++ (subst b) ++ c | [_, a, b, c] <- x]
          x = str =~ "(.*?)(<|>|\\|)|(.+)" :: [[String]]
          subst "" = ""
          subst x = "\\\\" ++ x

escapeChar :: String -> String
escapeChar str = str''' where
    str''' = replaceElt '<' "\\\\<" str''
    str''  = replaceElt '>' "\\\\>" str'
    str'   = replaceElt '|' "\\\\|" str
    
nextState :: State -> Tok -> State
nextState (State pii hlno str) t = State pii hlno str' where
    fieldno = case cl_ t of
                "obj" -> "3"
                "pred" -> "2"
                "sub" -> "1"
                "unk" -> "1"
                otherwise -> throw $ MyException $ "Bad field : " ++ cl_ t
    term = escapeChar $ term_ t
    lemma = escapeChar $ lemma_ t
    pos = simpleShow $ pos_ t
    str' = str ++ "<" ++ term ++ "|" ++ lemma ++ "|" ++ pos ++ "|" ++ fieldno ++ "|1>" 

mainLoop :: State -> Int -> IO ()
mainLoop st lineno = do
  eof <- isEOF
  if eof then return ()
  else do
    l <- getLine
    let st' = doLine l st
    case st' of
      StateEndHL pii hlno str -> do
                       putStrLn ((show pii) ++ "\t" ++ (show hlno) ++ "\t" ++ str)
                       mainLoop (StateExpectHL pii (hlno + 1)) (lineno + 1)
      otherwise -> mainLoop st' (lineno + 1)
    
main :: IO ()
main = mainLoop StateExpectPaper 1
       
