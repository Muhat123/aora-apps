import {
  createContext,
  useContext,
  useState,
  useEffect,
  Children,
} from "react";
import { getCurrentUser } from "../lib/appwrite";

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);
export const GlobalProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((res) => {
        if (res) {
          setIsLoggedIn(true);
          setUser(res);
        } else {
          setIsLoading(false);
          setUser(null);
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => setIsLoading(false));
  }, []);
  return <GlobalContext.Provider value={{
    isLoggedIn,
    user,
    isLoading,
    setIsLoggedIn,
    setUser,
  }}>{children}</GlobalContext.Provider>;
};
