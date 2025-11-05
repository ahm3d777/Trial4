document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const resumeForm = document.getElementById('resume-form');
    const templateSelect = document.getElementById('template-select');
    const realTimePreview = document.getElementById('real-time-preview');

    // Event listener for form input change
    if (resumeForm) {
        resumeForm.addEventListener('input', updatePreview);
    }

    // Event listener for template selection change
    if (templateSelect) {
        templateSelect.addEventListener('change', updatePreview);
    }

    // Function to update the Real-time Preview based on the selected template and form content
    function updatePreview() {
        // Get the selected template
        const selectedTemplate = templateSelect.value;

        // Add the appropriate template class to real-time preview
        realTimePreview.className = 'real-time-preview'; // Clear existing classes
        realTimePreview.classList.add(selectedTemplate); // Add selected template class

        // Generate HTML for the selected template and form content
        const templateHTML = generateTemplate(selectedTemplate);

        // Update the Real-time Preview with the generated HTML
        realTimePreview.innerHTML = templateHTML;
    }

    // Function to generate HTML for the selected template and form content
    function generateTemplate(template) {
        // Get the form data
        const formData = getFormData();

        // Generate HTML for the selected template with form content
        switch (template) {
            case 'template1':
                return generateTemplate1(formData);
            case 'template2':
                return generateTemplate2(formData);
            case 'template3':
                return generateTemplate3(formData);
            default:
                return '<p style="color: #888; text-align: center; padding: 40px;">Select a template to preview your resume</p>';
        }
    }

    // Function to generate HTML for Template 1 - Classic Professional
    function generateTemplate1(data) {
        return `
            <div class="resume-template template1-design">
                <div class="resume-header">
                    <h1 class="resume-name">${data.fullName || 'Your Name'}</h1>
                    <div class="contact-info">
                        ${data.email ? `<span>${data.email}</span>` : ''}
                        ${data.phone ? `<span>${data.phone}</span>` : ''}
                    </div>
                </div>

                ${data.education.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title">Education</h2>
                    ${data.education.map(edu => `
                        <div class="section-item">
                            <div class="item-header">
                                <h3>${edu.degree || 'Degree'}</h3>
                                <span class="item-date">${edu.year || ''}</span>
                            </div>
                            <p class="item-subtitle">${edu.school || 'School/University'}</p>
                            ${edu.major ? `<p class="item-detail">Major: ${edu.major}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                ${data.experience.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title">Work Experience</h2>
                    ${data.experience.map(exp => `
                        <div class="section-item">
                            <div class="item-header">
                                <h3>${exp.position || 'Position'}</h3>
                                <span class="item-date">${exp.duration || ''}</span>
                            </div>
                            <p class="item-subtitle">${exp.company || 'Company'}</p>
                            ${exp.description ? `<p class="item-description">${exp.description}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                ${data.skills.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title">Skills</h2>
                    <div class="skills-list">
                        ${data.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    // Function to generate HTML for Template 2 - Modern Minimal
    function generateTemplate2(data) {
        return `
            <div class="resume-template template2-design">
                <div class="resume-sidebar">
                    <div class="sidebar-section">
                        <h1 class="resume-name">${data.fullName || 'Your Name'}</h1>
                        <div class="contact-info">
                            ${data.email ? `<p>${data.email}</p>` : ''}
                            ${data.phone ? `<p>${data.phone}</p>` : ''}
                        </div>
                    </div>

                    ${data.skills.length > 0 ? `
                    <div class="sidebar-section">
                        <h2 class="section-title">Skills</h2>
                        <div class="skills-list">
                            ${data.skills.map(skill => `<div class="skill-item">${skill}</div>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>

                <div class="resume-main">
                    ${data.education.length > 0 ? `
                    <div class="resume-section">
                        <h2 class="section-title">Education</h2>
                        ${data.education.map(edu => `
                            <div class="section-item">
                                <div class="item-header">
                                    <h3>${edu.degree || 'Degree'}</h3>
                                    <span class="item-date">${edu.year || ''}</span>
                                </div>
                                <p class="item-subtitle">${edu.school || 'School/University'}</p>
                                ${edu.major ? `<p class="item-detail">Major: ${edu.major}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}

                    ${data.experience.length > 0 ? `
                    <div class="resume-section">
                        <h2 class="section-title">Experience</h2>
                        ${data.experience.map(exp => `
                            <div class="section-item">
                                <div class="item-header">
                                    <h3>${exp.position || 'Position'}</h3>
                                    <span class="item-date">${exp.duration || ''}</span>
                                </div>
                                <p class="item-subtitle">${exp.company || 'Company'}</p>
                                ${exp.description ? `<p class="item-description">${exp.description}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Function to generate HTML for Template 3 - Creative Bold
    function generateTemplate3(data) {
        return `
            <div class="resume-template template3-design">
                <div class="resume-header-bold">
                    <h1 class="resume-name">${data.fullName || 'Your Name'}</h1>
                    <div class="contact-info">
                        ${data.email ? `<span>${data.email}</span>` : ''}
                        ${data.phone ? `<span> | ${data.phone}</span>` : ''}
                    </div>
                </div>

                ${data.experience.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title-bold">EXPERIENCE</h2>
                    <div class="section-content">
                        ${data.experience.map(exp => `
                            <div class="section-item">
                                <div class="item-header">
                                    <div>
                                        <h3>${exp.position || 'Position'}</h3>
                                        <p class="item-subtitle">${exp.company || 'Company'}</p>
                                    </div>
                                    <span class="item-date">${exp.duration || ''}</span>
                                </div>
                                ${exp.description ? `<p class="item-description">${exp.description}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                ${data.education.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title-bold">EDUCATION</h2>
                    <div class="section-content">
                        ${data.education.map(edu => `
                            <div class="section-item">
                                <div class="item-header">
                                    <div>
                                        <h3>${edu.degree || 'Degree'}</h3>
                                        <p class="item-subtitle">${edu.school || 'School/University'}</p>
                                    </div>
                                    <span class="item-date">${edu.year || ''}</span>
                                </div>
                                ${edu.major ? `<p class="item-detail">Major: ${edu.major}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                ${data.skills.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title-bold">SKILLS</h2>
                    <div class="section-content">
                        <div class="skills-grid">
                            ${data.skills.map(skill => `<span class="skill-badge">${skill}</span>`).join('')}
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    // Function to get form data in structured format
    function getFormData() {
        return {
            fullName: document.getElementById('full_name')?.value || '',
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            education: getEducationEntries(),
            experience: getExperienceEntries(),
            skills: getSkills()
        };
    }

    // Get all education entries
    function getEducationEntries() {
        const entries = [];
        const containers = document.querySelectorAll('.education-entry');

        if (containers.length === 0) {
            // Fallback to single entry if dynamic entries not yet implemented
            const degree = document.getElementById('education_degree')?.value || '';
            const major = document.getElementById('education_major')?.value || '';
            const school = document.getElementById('education_school')?.value || '';
            const year = document.getElementById('education_year')?.value || '';

            if (degree || major || school || year) {
                entries.push({ degree, major, school, year });
            }
        } else {
            containers.forEach(container => {
                const degree = container.querySelector('[name="education_degree[]"]')?.value || '';
                const major = container.querySelector('[name="education_major[]"]')?.value || '';
                const school = container.querySelector('[name="education_school[]"]')?.value || '';
                const year = container.querySelector('[name="education_year[]"]')?.value || '';

                if (degree || major || school || year) {
                    entries.push({ degree, major, school, year });
                }
            });
        }

        return entries;
    }

    // Get all work experience entries
    function getExperienceEntries() {
        const entries = [];
        const containers = document.querySelectorAll('.experience-entry');

        if (containers.length === 0) {
            // Fallback to single entry if dynamic entries not yet implemented
            const position = document.getElementById('work_position')?.value || '';
            const company = document.getElementById('work_company')?.value || '';
            const duration = document.getElementById('work_duration')?.value || '';
            const description = document.getElementById('work_description')?.value || '';

            if (position || company || duration || description) {
                entries.push({ position, company, duration, description });
            }
        } else {
            containers.forEach(container => {
                const position = container.querySelector('[name="work_position[]"]')?.value || '';
                const company = container.querySelector('[name="work_company[]"]')?.value || '';
                const duration = container.querySelector('[name="work_duration[]"]')?.value || '';
                const description = container.querySelector('[name="work_description[]"]')?.value || '';

                if (position || company || duration || description) {
                    entries.push({ position, company, duration, description });
                }
            });
        }

        return entries;
    }

    // Get all skills
    function getSkills() {
        const skills = [];
        const skillContainers = document.querySelectorAll('.skill-entry');

        if (skillContainers.length === 0) {
            // Fallback to numbered skills if dynamic entries not yet implemented
            for (let i = 1; i <= 10; i++) {
                const skillInput = document.getElementById(`skill${i}`);
                if (skillInput && skillInput.value.trim()) {
                    skills.push(skillInput.value.trim());
                }
            }
        } else {
            skillContainers.forEach(container => {
                const skillInput = container.querySelector('[name="skill[]"]');
                if (skillInput && skillInput.value.trim()) {
                    skills.push(skillInput.value.trim());
                }
            });
        }

        return skills;
    }

    // Trigger initial preview update
    updatePreview();
});
