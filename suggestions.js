// Initialize the isAutoFilled variable
let isAutoFilled = false;
// Function to filter suggestions based on user input
function getSuggestions(inputValue, suggestionsArray) {
    return suggestionsArray.filter(suggestion => {
        // Implement your filtering logic here
        // In this example, we check if the suggestion includes the input value (case-insensitive)
        return suggestion.toLowerCase().includes(inputValue.toLowerCase());
    });
}

// Function to generate suggestions
function generateSuggestions(inputElement, suggestionsElement, suggestionsArray) {
    // Helper function to create suggestion elements
    function createSuggestionElement(suggestion) {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.classList.add('suggestion');
        suggestionDiv.innerHTML = suggestion;
        return suggestionDiv;
    }

    // Event handler for input
    function handleInput() {
        const inputValue = this.value.trim().toLowerCase();
        const filteredSuggestions = getSuggestions(inputValue, suggestionsArray);
        
        // Clear previous suggestions
        suggestionsElement.innerHTML = '';

        if (filteredSuggestions.length === 0 || inputValue === '') {
            suggestionsElement.style.display = 'none';
            return;
        }

        // Append new suggestions
        const fragment = document.createDocumentFragment();
        filteredSuggestions.forEach(suggestion => {
            const suggestionElement = createSuggestionElement(suggestion);
            fragment.appendChild(suggestionElement);
        });
        suggestionsElement.appendChild(fragment);

        // Show suggestions
        const inputRect = inputElement.getBoundingClientRect();
        suggestionsElement.style.display = 'block';
        suggestionsElement.style.top = `${inputRect.bottom}px`;
        suggestionsElement.style.left = `${inputRect.left}px`;
    }

    // Event handler for blur
    function handleBlur() {
        setTimeout(() => {
            suggestionsElement.style.display = 'none';
        }, 200);
    }

    // Attach event listeners
    inputElement.addEventListener('input', debounce(handleInput, 300));
    inputElement.addEventListener('blur', handleBlur);
}

// Debounce function to delay input event handling
function debounce(func, delay) {
    let timer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

// Function to handle click on suggestions
function handleSuggestionClick(event) {
    const suggestion = event.target.textContent.trim();

    if (!event.target.classList.contains('suggestion')) return;

    const inputField = event.target.closest('.form-group').querySelector('input[type="text"], textarea');
    if (!inputField) {
        console.error('Input field not found for the clicked suggestion.');
        return;
    }

    inputField.value = suggestion;
    inputField.focus();
    event.target.closest('.suggestions').style.display = 'none';

    // Set auto-fill flag
    isAutoFilled = true;
}


// Attach event listener to handle click on suggestions
document.addEventListener('click', handleSuggestionClick);

// Generate suggestions for various input fields
const inputsAndSuggestions = [
    { input: 'education_degree', suggestions: 'education-degree-suggestions', suggestionsArray: ['Bachelor of Science', 'Master of Arts', 'Doctor of Philosophy', 'Associate Degree', 'Professional Certificate', 'High School Diploma', 'Associate of Applied Science', 'Master of Business Administration', 'Juris Doctor'] },
    { input: 'education_major', suggestions: 'education-major-suggestions', suggestionsArray: ['Computer Science', 'Psychology', 'Business Administration', 'Engineering', 'English Literature', 'Mathematics', 'Sociology', 'Biology', 'Finance', 'Marketing'] },
    { input: 'education_school', suggestions: 'education-school-suggestions', suggestionsArray: ['Harvard University', 'Stanford University', 'Massachusetts Institute of Technology', 'University of California, Berkeley', 'Yale University', 'Princeton University', 'Columbia University', 'University of Oxford', 'University of Cambridge', 'California Institute of Technology'] },
    { input: 'education_year', suggestions: 'education-year-suggestions', suggestionsArray: ['2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034'] },
    { input: 'work_position', suggestions: 'work-position-suggestions', suggestionsArray: ['Software Engineer', 'Web Developer', 'Data Analyst', 'Project Manager', 'UI/UX Designer', 'Product Manager', 'Marketing Specialist', 'Financial Analyst', 'Human Resources Manager', 'Operations Manager'] },
    { input: 'work_company', suggestions: 'work-company-suggestions', suggestionsArray: ['Company A', 'Company B', 'Company C', 'Company D', 'Company E', 'Company F', 'Company G', 'Company H', 'Company I', 'Company J'] },
    { input: 'work_duration', suggestions: 'work-duration-suggestions', suggestionsArray: ['1 year', '2 years', '3 years', '4 years', '5 years', '6 years', '7 years', '8 years', '9 years', '10 years', '11 years', '12 years'] },
    { input: 'skill1', suggestions: 'skill-suggestions-1', suggestionsArray: ['JavaScript', 'HTML', 'CSS', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js', 'SQL'] },
    { input: 'skill2', suggestions: 'skill-suggestions-2', suggestionsArray: ['JavaScript', 'HTML', 'CSS', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js', 'SQL'] },
    { input: 'skill3', suggestions: 'skill-suggestions-3', suggestionsArray: ['JavaScript', 'HTML', 'CSS', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js', 'SQL'] }
];

// Generate suggestions for each input field
inputsAndSuggestions.forEach(({ input, suggestions, suggestionsArray }) => {
    const inputElement = document.getElementById(input);
    const suggestionsElement = document.getElementById(suggestions);
    generateSuggestions(inputElement, suggestionsElement, suggestionsArray);
});
