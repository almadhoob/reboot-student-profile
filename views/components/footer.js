const Footer = () => {
  const footerElement = document.createElement("footer");
  footerElement.className = "footer";
  footerElement.innerHTML = `
        <div class="footer-content">
            <p>&copy; 2023 01 Edu. All rights reserved.</p>
            <nav>
                <a href="#home">Home</a>
                <a href="#login">Login</a>
                <a href="#profile">Profile</a>
            </nav>
        </div>
    `;
  return footerElement;
};

export default Footer;
