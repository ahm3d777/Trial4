# Professional Resume Builder

Create a professional resume in minutes with our easy-to-use resume builder application.

## Features

### 🎨 Multiple Professional Templates
- **Template 1 - Classic Professional**: Traditional layout with centered header and clean sections
- **Template 2 - Modern Minimal**: Sidebar layout with bold design elements
- **Template 3 - Creative Bold**: Eye-catching design with bold headers and gradient accents

### ✨ Core Features
- **Real-time Preview**: See your resume update as you type
- **Multiple Entries**: Add multiple work experiences, education entries, and skills
- **Auto-save**: Your resumes are automatically saved in your browser
- **PDF Export**: Download your resume as a professional PDF document
- **Print**: A dedicated "Print" button + print stylesheet gives a clean, native browser print of just the resume (separate from the PDF button, which rasterizes the preview)
- **Shrink to fit one page**: An optional toggle that automatically scales down type and spacing - but only when your resume would otherwise spill onto a second page
- **Dashboard**: Manage all your saved resumes in one place
- **Smart Suggestions**: Get autocomplete suggestions for common fields
- **Light / Dark theme**: A toggle in the header switches the editor between a dark and a light, paper-like look; your choice is remembered

### 🧩 Arrange Your Resume
- **Reorder & hide sections**: An "Arrange Your Sections" panel lets you drag (or use the ▲/▼ buttons) to reorder Professional Summary, Education, Work Experience, Projects, Skills, Certifications, and Languages, and uncheck any of them to leave it off the resume entirely. Two-column templates (Modern Minimal, Executive) keep sidebar/main grouping but still follow your order within each column.
- **Drag-and-drop entries**: Every entry (education, experience, skills, projects, certifications, languages) - including the first one in each section - has a drag handle plus ▲/▼ buttons, so you can put your most recent job or degree on top.

### 💾 Data Management
- **Local Storage**: All data is stored locally in your browser
- **Create Multiple Resumes**: Build and save as many resumes as you need
- **Edit Anytime**: Load and edit your saved resumes whenever you want
- **Delete Resumes**: Remove resumes you no longer need
- **Storage usage**: The dashboard shows how much of this browser's storage your resumes (and their history) are using, with one-click **Export All** (every resume as one JSON backup) and **Delete All** (double-confirmed) actions
- **Autosave history**: Each resume keeps a capped, throttled history of earlier autosaved versions - open "History" on a dashboard card to preview timestamps and restore an earlier version into the editor

## How to Use

### Getting Started
1. Open `index.html` in your web browser
2. Click "Get Started" to go to the resume editor
3. Fill in your information in the form
4. Select a template from the dropdown
5. Watch your resume preview update in real-time

### Adding Information

#### Personal Information
- Fill in your full name, email, and phone number

#### Education
- Add your degree, major, school, and graduation year
- Click "+ Add Another Education" to add multiple education entries
- Remove entries using the "Remove" button

#### Work Experience
- Add your position, company, duration, and job description
- Click "+ Add Another Experience" to add multiple work experiences
- Remove entries using the "Remove" button

#### Skills
- Add your skills one by one
- Click "+ Add Another Skill" to add more skills
- Remove skills using the "×" button

### Saving Your Resume
- Click "Save Resume" to save your current resume
- Your resume is automatically saved to your browser's local storage
- You can create multiple resumes and switch between them

### Managing Resumes
1. Click "My Resumes" to view your dashboard
2. From the dashboard you can:
   - **Edit**: Load a resume for editing
   - **Download**: Export the resume as a PDF
   - **Delete**: Remove the resume permanently

### Downloading as PDF
1. Complete your resume
2. Click "Download" from the dashboard, or
3. Use the download button on the preview page
4. Your resume will be downloaded as a PDF file

## Technical Details

### Technologies Used
- **HTML5**: Structure and layout
- **CSS3**: Styling and responsive design
- **JavaScript (ES6+)**: Interactive functionality
- **html2pdf.js**: PDF generation
- **localStorage API**: Data persistence

### Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Any modern browser with JavaScript enabled

### File Structure
```
├── index.html              # Landing page
├── Resume-Editor.html      # Main resume editor
├── styles.css              # Landing page styles
├── Resume-Editor.css       # Editor page styles
├── templates.js            # Resume template generators + live preview
├── suggestions.js          # Autocomplete functionality
├── resume-builder.js       # Main app functionality (forms, save/load, PDF export)
└── assets/                 # Images and resources
```

There's no build step and no server — it's plain HTML/CSS/JS. Open `index.html` (or serve the folder with any static file server) and it works.

## Features in Detail

### Real-time Preview
As you type in the form, your resume preview updates immediately, allowing you to see exactly how your resume will look.

### Template Selection
Choose from three professionally designed templates:
- Each template has a unique layout and color scheme
- Templates are optimized for professional appearance
- Easy to switch between templates

### Dynamic Fields
- Add as many education entries as needed
- Add multiple work experiences
- Add unlimited skills
- Remove any entry you don't want

### Local Storage
- All resumes are saved in your browser
- No server required - works completely offline
- Your data never leaves your computer
- Privacy-focused design

### PDF Export
- High-quality PDF generation
- Professional formatting maintained
- Download with one click
- Filename based on your name

## Tips for Best Results

1. **Be Concise**: Keep descriptions clear and to the point
2. **Use Action Verbs**: Start experience descriptions with strong action verbs
3. **Quantify Achievements**: Include numbers and metrics where possible
4. **Proofread**: Check for spelling and grammar errors
5. **Choose the Right Template**: Select a template that matches your industry
6. **Update Regularly**: Keep your resume current with your latest experiences

## Privacy & Data

- All data is stored locally in your browser
- No data is sent to any server
- Your information is completely private
- Clear your browser data to remove all saved resumes

## Support

If you encounter any issues or have suggestions:
- Check the browser console for error messages
- Ensure JavaScript is enabled
- Try refreshing the page
- Clear browser cache if experiencing issues

## Future Enhancements

Potential features for future versions:
- More template options
- Import from LinkedIn
- Export to different formats (Word, etc.)
- Cloud storage integration
- Resume scoring and tips
- Collaboration features

---

**Created with ❤️ for job seekers everywhere**

Start building your professional resume today!
