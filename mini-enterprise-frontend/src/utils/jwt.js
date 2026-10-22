export const getUserFromToken = () => {
  const token = localStorage.getItem("access_token");

  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    return {
      id: Number(payload.sub),
      email: payload.email,

      // FIX: always convert role to lowercase and remove spaces
      role: (payload.role || "").toString().trim().toLowerCase(),

      name: payload.name || payload.full_name || "",
    };
  } catch (err) {
    console.error("JWT Decode Error:", err);
    localStorage.removeItem("access_token");
    return null;
  }
};