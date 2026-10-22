
import { useAuth0 } from "@auth0/auth0-react";

function GetToken() {
  const {
    getAccessTokenSilently,
    isAuthenticated,
    loginWithRedirect,
  } = useAuth0();

  const handleGetToken = async () => {
    try {
      if (!isAuthenticated) {
        await loginWithRedirect();
        return;
      }

      const token = await getAccessTokenSilently();

      console.log("Auth0 Access Token:", token);
      alert("Access token retrieved! Check the browser console.");
    } catch (error) {
      console.error("Token error:", error);
    }
  };

  return (
    <button onClick={handleGetToken}>
      Get Access Token
    </button>
  );
}

export default GetToken;
