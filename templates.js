document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const resumeForm = document.getElementById('resume-form');
    const templateSelect = document.getElementById('template-select');
    const realTimePreview = document.getElementById('real-time-preview');

    // Event listener for form input change
    resumeForm.addEventListener('input', updatePreview);

    // Event listener for template selection change
    templateSelect.addEventListener('change', updatePreview);

    // Function to update the Real-time Preview based on the selected template and form content
    function updatePreview() {
        // Get the selected template
        const selectedTemplate = templateSelect.value;

        // Add the appropriate template class to real-time preview
        realTimePreview.className = ''; // Clear existing classes
        realTimePreview.classList.add(selectedTemplate); // Add selected template class

        // Generate HTML for the selected template and form content
        const templateHTML = generateTemplate(selectedTemplate);

        // Update the Real-time Preview with the generated HTML
        realTimePreview.innerHTML = templateHTML;
    }

    // Function to generate HTML for the selected template and form content
    function generateTemplate(template) {
        // Get the form content
        const formContent = getFormContent();

        // Generate HTML for the selected template with form content
        switch (template) {
            case 'template1':
                return generateTemplate1(formContent);
            case 'template2':
                return generateTemplate2(formContent);
            case 'template3':
                return generateTemplate3(formContent);
            default:
                return '<p>No template selected</p>';
        }
    }

    // Function to generate HTML for Template 1
    function generateTemplate1(formContent) {
        // Generate HTML for Template 1
        return `
            <div class="template1">
                <!-- Insert Template 1 content here -->
                ${formContent}
            </div>
        `;
    }

    // Function to generate HTML for Template 2
    function generateTemplate2(formContent) {
        // Generate HTML for Template 2
        return `
            <div class="template2">
                <!-- Insert Template 2 content here -->
                ${formContent}
            </div>
        `;
    }

    // Function to generate HTML for Template 3
    function generateTemplate3(formContent) {
        // Generate HTML for Template 3
        return `
            <div class="template3">
                <!-- Insert Template 3 content here -->
                ${formContent}
            </div>
        `;
    }

    // Function to get the current form content
    function getFormContent() {
        // Get all form fields
        const formFields = resumeForm.querySelectorAll('input, textarea, select');
        let formContent = '';

        // Iterate over form fields and include their values in the preview
        formFields.forEach(field => {
            // Include field label and value in the preview if the value is not empty
            if (field.value.trim() !== '') {
                formContent += `<p><strong>${field.previousElementSibling.textContent.trim()}:</strong> ${field.value}</p>`;
            }
        });

        return formContent;
    }

    // Trigger initial preview update
    updatePreview();
});
