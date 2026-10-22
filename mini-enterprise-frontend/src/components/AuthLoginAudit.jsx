import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import api from "../services/axios";
export default function AuthLoginAudit() {
const {
isAuthenticated,
isLoading,
getAccessTokenSilently,
user,
} = useAuth0();
useEffect(() => {
if (isLoading || !isAuthenticated || !user?.sub) {
return;
}
const storageKey = "mecw-login-audit:" + user.sub;
if (sessionStorage.getItem(storageKey)) {
return;
}
let cancelled = false;
async function recordLogin() {
try {
const token = await getAccessTokenSilently({
authorizationParams: {
audience: import.meta.env.VITE_AUTH0_AUDIENCE,
},
});
if (cancelled) return;
await api.post("/audit-logs/login-event", null, {
headers: {
Authorization: "Bearer " + token,
},
});
if (!cancelled) {
sessionStorage.setItem(storageKey, "recorded");
console.log("Auth0 login audit recorded successfully");
}
} catch (error) {
console.error(
"Failed to record Auth0 login audit:",
error.response?.data || error.message
);
}
}
recordLogin();
return () => {
cancelled = true;
};
}, [
isAuthenticated,
isLoading,
user?.sub,
getAccessTokenSilently,
]);
return null;
}