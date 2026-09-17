export const getUserFromToken = () => {
  const token = localStorage.getItem("access_token");

  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    return {
      id: Number(payload.sub),
      email: payload.email,
      role: payload.role,
    };
  } catch (err) {
    localStorage.removeItem("access_token");
    return null;
  }
};