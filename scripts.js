// scripts.js

window.addEventListener('scroll', function() {
    let offset = window.pageYOffset;
    let parallaxElements = document.querySelectorAll('.parallax-section');

    parallaxElements.forEach(function(element) {
        let speed = element.dataset.speed;
        element.style.backgroundPositionY = -offset * speed + 'px';
    });
});
