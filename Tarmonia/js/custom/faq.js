// Select all FAQ questions
document.querySelectorAll('.faq-item h3').forEach(question => {
    question.addEventListener('click', () => {
        // Toggle the active class on the clicked question
        question.classList.toggle('active');

        // Get the corresponding answer (next sibling element)
        const answer = question.nextElementSibling;

        // Toggle the visibility of the answer
        if (answer.style.display === 'block') {
            answer.style.display = 'none';
        } else {
            answer.style.display = 'block';
        }
    });
});