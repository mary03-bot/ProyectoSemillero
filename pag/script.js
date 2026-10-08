const botonMenu = document.getElementById('responsive');
const navLinks = document.getElementById('nav-links');

botonMenu.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

document.querySelectorAll('#nav-links a').forEach(enlace => {
    enlace.addEventListener('click', () => {
    navLinks.classList.remove('active');
    });
});