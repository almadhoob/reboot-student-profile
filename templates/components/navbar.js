const navbar = () => {
  const nav = document.createElement("nav");
  nav.className = "navbar";

  const homeLink = document.createElement("a");
  homeLink.href = "#home";
  homeLink.innerText = "Home";
  nav.appendChild(homeLink);

  const loginLink = document.createElement("a");
  loginLink.href = "#login";
  loginLink.innerText = "Login";
  nav.appendChild(loginLink);

  const profileLink = document.createElement("a");
  profileLink.href = "#profile";
  profileLink.innerText = "Profile";
  nav.appendChild(profileLink);

  return nav;
};

export default navbar;
