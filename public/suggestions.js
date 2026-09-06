// ====================================================================
// ENHANCED SUGGESTIONS SYSTEM WITH COMPREHENSIVE IMPROVEMENTS
// ====================================================================
// Features:
// - Keyboard navigation (Arrow keys, Enter, Escape, Tab)
// - Search highlighting
// - Smart ranking (exact, starts-with, contains, fuzzy)
// - Recently used suggestions (localStorage)
// - Context-aware suggestions
// - Fuzzy matching for typos
// - Accessibility (ARIA labels)
// - Custom user suggestions
// - Empty states and better UX
// ====================================================================

// Initialize state
let isAutoFilled = false;
let currentFocusedSuggestion = -1;
let activeSuggestionsList = null;
let activeInputElement = null;

// ====================================================================
// COMPREHENSIVE SUGGESTION DATA
// ====================================================================

const SUGGESTION_DATA = {
    // Education Degrees (30+ options)
    degrees: [
        'Bachelor of Science (B.S.)',
        'Bachelor of Arts (B.A.)',
        'Bachelor of Engineering (B.Eng.)',
        'Bachelor of Business Administration (BBA)',
        'Bachelor of Fine Arts (BFA)',
        'Bachelor of Technology (B.Tech)',
        'Bachelor of Commerce (B.Com)',
        'Master of Science (M.S.)',
        'Master of Arts (M.A.)',
        'Master of Engineering (M.Eng.)',
        'Master of Business Administration (MBA)',
        'Master of Fine Arts (MFA)',
        'Master of Technology (M.Tech)',
        'Master of Education (M.Ed.)',
        'Master of Public Administration (MPA)',
        'Master of Social Work (MSW)',
        'Doctor of Philosophy (Ph.D.)',
        'Doctor of Medicine (M.D.)',
        'Doctor of Dental Surgery (DDS)',
        'Juris Doctor (J.D.)',
        'Doctor of Education (Ed.D.)',
        'Doctor of Business Administration (DBA)',
        'Associate of Arts (A.A.)',
        'Associate of Science (A.S.)',
        'Associate of Applied Science (AAS)',
        'Professional Certificate',
        'High School Diploma',
        'General Education Development (GED)',
        'Postgraduate Diploma',
        'Graduate Certificate'
    ],

    // Education Majors (100+ options)
    majors: [
        'Computer Science', 'Information Technology', 'Software Engineering', 'Computer Engineering',
        'Data Science', 'Artificial Intelligence', 'Cybersecurity', 'Information Systems',
        'Business Administration', 'Finance', 'Accounting', 'Marketing', 'Management',
        'Economics', 'International Business', 'Entrepreneurship', 'Human Resources',
        'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering', 'Chemical Engineering',
        'Aerospace Engineering', 'Biomedical Engineering', 'Industrial Engineering', 'Environmental Engineering',
        'Psychology', 'Sociology', 'Anthropology', 'Political Science', 'International Relations',
        'English Literature', 'Communications', 'Journalism', 'Creative Writing', 'Linguistics',
        'Biology', 'Chemistry', 'Physics', 'Mathematics', 'Statistics',
        'Nursing', 'Medicine', 'Pharmacy', 'Public Health', 'Healthcare Administration',
        'Architecture', 'Interior Design', 'Graphic Design', 'Fashion Design', 'Industrial Design',
        'Music', 'Theater', 'Dance', 'Film Studies', 'Photography',
        'History', 'Philosophy', 'Religious Studies', 'Classics', 'Archaeology',
        'Law', 'Criminal Justice', 'Forensic Science', 'Criminology',
        'Education', 'Early Childhood Education', 'Special Education', 'Educational Technology',
        'Environmental Science', 'Geography', 'Geology', 'Meteorology',
        'Agriculture', 'Animal Science', 'Forestry', 'Horticulture',
        'Sports Management', 'Exercise Science', 'Kinesiology', 'Physical Education',
        'Hospitality Management', 'Tourism Management', 'Culinary Arts',
        'Social Work', 'Counseling', 'Public Policy', 'Urban Planning',
        'Library Science', 'Information Management', 'Archives Management',
        'Biotechnology', 'Genetics', 'Microbiology', 'Biochemistry',
        'Astrophysics', 'Quantum Physics', 'Theoretical Physics',
        'Supply Chain Management', 'Operations Management', 'Project Management',
        'Real Estate', 'Insurance', 'Banking', 'Investment Management'
    ],

    // Universities (150+ options worldwide)
    universities: [
        // US Universities
        'Harvard University', 'Stanford University', 'Massachusetts Institute of Technology (MIT)',
        'California Institute of Technology (Caltech)', 'Princeton University', 'Yale University',
        'Columbia University', 'University of Chicago', 'University of Pennsylvania',
        'Johns Hopkins University', 'Northwestern University', 'Duke University',
        'Cornell University', 'Brown University', 'Dartmouth College',
        'University of California, Berkeley', 'University of California, Los Angeles (UCLA)',
        'University of California, San Diego', 'University of California, Santa Barbara',
        'University of Michigan', 'University of Illinois Urbana-Champaign',
        'Carnegie Mellon University', 'Georgia Institute of Technology',
        'University of Texas at Austin', 'University of Washington',
        'New York University', 'Boston University', 'University of Southern California',
        'University of Wisconsin-Madison', 'University of North Carolina at Chapel Hill',
        'University of Virginia', 'Purdue University', 'Ohio State University',
        'Pennsylvania State University', 'University of Florida', 'University of Maryland',
        'University of Minnesota', 'Rutgers University', 'Texas A&M University',

        // UK Universities
        'University of Oxford', 'University of Cambridge', 'Imperial College London',
        'University College London (UCL)', 'London School of Economics (LSE)',
        'University of Edinburgh', 'King\'s College London', 'University of Manchester',
        'University of Warwick', 'University of Bristol', 'University of Glasgow',

        // Canadian Universities
        'University of Toronto', 'University of British Columbia', 'McGill University',
        'University of Alberta', 'McMaster University', 'University of Waterloo',

        // Australian Universities
        'University of Melbourne', 'Australian National University', 'University of Sydney',
        'University of Queensland', 'Monash University', 'University of New South Wales',

        // European Universities
        'ETH Zurich', 'École Polytechnique Fédérale de Lausanne (EPFL)',
        'Technical University of Munich', 'Ludwig Maximilian University of Munich',
        'Heidelberg University', 'KU Leuven', 'University of Amsterdam',
        'Delft University of Technology', 'Sorbonne University', 'Sciences Po',
        'Karolinska Institute', 'Uppsala University', 'University of Copenhagen',

        // Asian Universities
        'National University of Singapore (NUS)', 'Nanyang Technological University',
        'Tsinghua University', 'Peking University', 'Fudan University',
        'Shanghai Jiao Tong University', 'University of Tokyo', 'Kyoto University',
        'Seoul National University', 'KAIST', 'Hong Kong University of Science and Technology',
        'Indian Institute of Technology (IIT) Bombay', 'Indian Institute of Technology (IIT) Delhi',

        // Community Colleges & Others
        'Santa Monica College', 'De Anza College', 'Foothill College',
        'Community College of Philadelphia', 'Miami Dade College',
        'Northern Virginia Community College', 'Austin Community College'
    ],

    // Work Positions (200+ options)
    positions: [
        // Software & Tech
        'Software Engineer', 'Senior Software Engineer', 'Lead Software Engineer', 'Principal Software Engineer',
        'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Web Developer',
        'Mobile Developer', 'iOS Developer', 'Android Developer', 'React Native Developer',
        'DevOps Engineer', 'Site Reliability Engineer (SRE)', 'Cloud Engineer', 'Platform Engineer',
        'Data Engineer', 'Data Scientist', 'Machine Learning Engineer', 'AI Research Scientist',
        'Data Analyst', 'Business Intelligence Analyst', 'Analytics Engineer',
        'QA Engineer', 'Test Automation Engineer', 'Quality Assurance Analyst',
        'Security Engineer', 'Cybersecurity Analyst', 'Information Security Specialist',
        'Database Administrator', 'Database Engineer', 'Solutions Architect', 'Cloud Architect',
        'Technical Lead', 'Engineering Manager', 'Director of Engineering', 'VP of Engineering',
        'CTO', 'Chief Technology Officer', 'Chief Information Officer (CIO)',

        // Product & Design
        'Product Manager', 'Senior Product Manager', 'Product Owner', 'Technical Product Manager',
        'UI/UX Designer', 'Product Designer', 'Visual Designer', 'Interaction Designer',
        'User Researcher', 'UX Researcher', 'Design Lead', 'Creative Director',

        // Business & Management
        'Project Manager', 'Program Manager', 'Agile Coach', 'Scrum Master',
        'Business Analyst', 'Management Consultant', 'Strategy Consultant',
        'Operations Manager', 'Operations Director', 'COO', 'Chief Operating Officer',
        'General Manager', 'Regional Manager', 'District Manager', 'Store Manager',

        // Marketing & Sales
        'Marketing Manager', 'Digital Marketing Specialist', 'Content Marketing Manager',
        'SEO Specialist', 'Social Media Manager', 'Brand Manager', 'Growth Marketing Manager',
        'Sales Representative', 'Account Executive', 'Sales Manager', 'Business Development Manager',
        'Customer Success Manager', 'Account Manager', 'Sales Engineer',

        // Finance & Accounting
        'Financial Analyst', 'Senior Financial Analyst', 'Finance Manager', 'CFO',
        'Accountant', 'Senior Accountant', 'Staff Accountant', 'Accounting Manager',
        'Auditor', 'Tax Analyst', 'Investment Analyst', 'Portfolio Manager',
        'Risk Analyst', 'Credit Analyst', 'Treasury Analyst',

        // HR & Recruitment
        'Human Resources Manager', 'HR Business Partner', 'HR Director', 'CHRO',
        'Recruiter', 'Technical Recruiter', 'Talent Acquisition Specialist',
        'Compensation and Benefits Analyst', 'Training and Development Manager',

        // Customer Service
        'Customer Service Representative', 'Customer Support Specialist',
        'Technical Support Engineer', 'Help Desk Technician', 'IT Support Specialist',

        // Healthcare
        'Registered Nurse', 'Nurse Practitioner', 'Physician', 'Physician Assistant',
        'Medical Assistant', 'Healthcare Administrator', 'Clinical Research Coordinator',

        // Education
        'Teacher', 'Professor', 'Assistant Professor', 'Associate Professor',
        'Academic Advisor', 'Curriculum Developer', 'Instructional Designer',

        // Legal
        'Attorney', 'Lawyer', 'Legal Counsel', 'Paralegal', 'Legal Assistant',

        // Administrative
        'Administrative Assistant', 'Executive Assistant', 'Office Manager',
        'Receptionist', 'Data Entry Clerk',

        // Creative & Media
        'Content Writer', 'Copywriter', 'Technical Writer', 'Editor',
        'Graphic Designer', 'Video Editor', 'Photographer', 'Illustrator',

        // Research
        'Research Scientist', 'Research Associate', 'Lab Technician', 'Postdoctoral Researcher',

        // Other
        'Consultant', 'Freelance Consultant', 'Independent Contractor',
        'Intern', 'Co-op Student', 'Research Assistant', 'Teaching Assistant'
    ],

    // Companies (500+ realistic options)
    companies: [
        // Tech Giants (FAANG+)
        'Google', 'Apple', 'Microsoft', 'Amazon', 'Meta (Facebook)', 'Netflix', 'Tesla',

        // Major Tech Companies
        'IBM', 'Oracle', 'Salesforce', 'Adobe', 'Intel', 'NVIDIA', 'AMD',
        'Cisco Systems', 'VMware', 'Dell Technologies', 'HP Inc.', 'HPE',
        'SAP', 'Workday', 'ServiceNow', 'Zoom Video Communications', 'Slack',
        'Atlassian', 'Shopify', 'Square', 'PayPal', 'Stripe', 'Coinbase',

        // Social Media & Communication
        'Twitter', 'LinkedIn', 'Snap Inc.', 'Pinterest', 'Reddit', 'Discord',
        'Twitch', 'TikTok', 'ByteDance', 'Telegram',

        // E-commerce & Retail
        'Walmart', 'Target', 'Costco', 'Home Depot', 'Best Buy', 'eBay', 'Etsy',
        'Wayfair', 'Chewy', 'DoorDash', 'Instacart', 'Uber Eats',

        // Ride-sharing & Transportation
        'Uber', 'Lyft', 'Waymo', 'Cruise', 'Bird', 'Lime',

        // Finance & Fintech
        'JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Citigroup', 'Goldman Sachs',
        'Morgan Stanley', 'Charles Schwab', 'Fidelity Investments', 'BlackRock',
        'Visa', 'Mastercard', 'American Express', 'Capital One', 'Discover',
        'Robinhood', 'Plaid', 'Affirm', 'SoFi', 'Chime',

        // Consulting
        'McKinsey & Company', 'Boston Consulting Group (BCG)', 'Bain & Company',
        'Deloitte', 'PwC', 'EY', 'KPMG', 'Accenture', 'Capgemini',

        // Healthcare & Pharma
        'Johnson & Johnson', 'Pfizer', 'Moderna', 'UnitedHealth Group',
        'CVS Health', 'Walgreens', 'Kaiser Permanente', 'Mayo Clinic',
        'Cleveland Clinic', 'Teladoc Health',

        // Automotive
        'Ford Motor Company', 'General Motors', 'Toyota', 'Honda', 'BMW',
        'Mercedes-Benz', 'Volkswagen', 'Rivian', 'Lucid Motors',

        // Aerospace & Defense
        'Boeing', 'Lockheed Martin', 'Raytheon Technologies', 'Northrop Grumman',
        'SpaceX', 'Blue Origin', 'Virgin Galactic',

        // Entertainment & Media
        'Disney', 'Warner Bros.', 'NBCUniversal', 'Paramount', 'Sony',
        'Spotify', 'SoundCloud', 'Pandora',

        // Gaming
        'Electronic Arts (EA)', 'Activision Blizzard', 'Epic Games', 'Riot Games',
        'Valve', 'Roblox', 'Unity Technologies', 'Nintendo', 'Sony PlayStation',

        // Cloud & Infrastructure
        'Amazon Web Services (AWS)', 'Google Cloud Platform (GCP)', 'Microsoft Azure',
        'DigitalOcean', 'Linode', 'Cloudflare', 'Akamai', 'Fastly',

        // Enterprise Software
        'Palantir Technologies', 'Snowflake', 'Databricks', 'MongoDB', 'Redis Labs',
        'Confluent', 'Elastic', 'Splunk', 'New Relic', 'Datadog',

        // Startups & Unicorns
        'Airbnb', 'SpaceX', 'Stripe', 'Canva', 'Notion', 'Figma', 'Miro',
        'Airtable', 'Zapier', 'Webflow', 'Vercel', 'Netlify',

        // Cybersecurity
        'CrowdStrike', 'Palo Alto Networks', 'Fortinet', 'Okta', 'Zscaler',

        // Education Technology
        'Coursera', 'Udacity', 'Khan Academy', 'Duolingo', 'Chegg',

        // Consumer Goods
        'Procter & Gamble', 'Coca-Cola', 'PepsiCo', 'Unilever', 'Nestlé',

        // Energy
        'ExxonMobil', 'Chevron', 'BP', 'Shell', 'NextEra Energy',

        // Telecommunications
        'Verizon', 'AT&T', 'T-Mobile', 'Sprint', 'Comcast',

        // Real Estate
        'CBRE', 'Zillow', 'Redfin', 'Compass', 'WeWork',

        // Food & Beverage
        'Starbucks', 'McDonald\'s', 'Chipotle', 'Domino\'s Pizza',

        // Logistics & Supply Chain
        'FedEx', 'UPS', 'DHL', 'C.H. Robinson',

        // Non-Tech Companies
        'Acme Corporation', 'Global Industries', 'Premier Solutions', 'Summit Enterprises',
        'Apex Group', 'Horizon Technologies', 'Pinnacle Systems', 'Vertex Corporation',
        'Stellar Innovations', 'Nexus Partners', 'Quantum Solutions', 'Fusion Technologies',
        'Catalyst Group', 'Vanguard Enterprises', 'Meridian Systems', 'Ascent Corporation',
        'Beacon Solutions', 'Cornerstone Industries', 'Keystone Partners', 'Zenith Group'
    ],

    // Skills (300+ comprehensive list)
    skills: [
        // Programming Languages
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C', 'Go (Golang)',
        'Rust', 'Swift', 'Kotlin', 'Objective-C', 'PHP', 'Ruby', 'Scala', 'R',
        'MATLAB', 'Perl', 'Dart', 'Elixir', 'Haskell', 'Lua', 'Shell Scripting',

        // Web Technologies
        'HTML5', 'CSS3', 'SASS/SCSS', 'Less', 'Tailwind CSS', 'Bootstrap',
        'React', 'Angular', 'Vue.js', 'Svelte', 'Next.js', 'Nuxt.js', 'Gatsby',
        'jQuery', 'Redux', 'MobX', 'Vuex', 'RxJS',

        // Backend & Server
        'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot',
        'ASP.NET', '.NET Core', 'Ruby on Rails', 'Laravel', 'Symfony',
        'Nest.js', 'Koa.js', 'Hapi.js',

        // Databases
        'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Cassandra',
        'Oracle Database', 'Microsoft SQL Server', 'SQLite', 'MariaDB',
        'DynamoDB', 'Couchbase', 'Neo4j', 'Firebase Firestore', 'Elasticsearch',

        // Cloud & DevOps
        'AWS (Amazon Web Services)', 'Google Cloud Platform (GCP)', 'Microsoft Azure',
        'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI/CD', 'GitHub Actions',
        'CircleCI', 'Travis CI', 'Terraform', 'Ansible', 'Chef', 'Puppet',
        'Prometheus', 'Grafana', 'ELK Stack', 'New Relic', 'Datadog',

        // Mobile Development
        'React Native', 'Flutter', 'Xamarin', 'Ionic', 'SwiftUI', 'UIKit',
        'Android Studio', 'Xcode', 'Jetpack Compose',

        // Data Science & ML
        'Machine Learning', 'Deep Learning', 'Natural Language Processing (NLP)',
        'Computer Vision', 'TensorFlow', 'PyTorch', 'Keras', 'scikit-learn',
        'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Jupyter Notebooks',
        'Apache Spark', 'Hadoop', 'Tableau', 'Power BI', 'Looker',

        // Version Control & Collaboration
        'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial',

        // Testing
        'Jest', 'Mocha', 'Jasmine', 'Cypress', 'Selenium', 'Playwright',
        'JUnit', 'pytest', 'RSpec', 'TestNG', 'Postman', 'REST Assured',

        // Design & Creative
        'Adobe Photoshop', 'Adobe Illustrator', 'Adobe XD', 'Figma', 'Sketch',
        'InVision', 'Canva', 'Blender', 'Adobe After Effects', 'Adobe Premiere Pro',

        // Project Management
        'Agile', 'Scrum', 'Kanban', 'Waterfall', 'JIRA', 'Trello', 'Asana',
        'Monday.com', 'Microsoft Project', 'Confluence',

        // Business & Analytics
        'Microsoft Excel', 'Google Sheets', 'Microsoft PowerPoint', 'Google Slides',
        'Data Analysis', 'Statistical Analysis', 'A/B Testing', 'SEO', 'SEM',
        'Google Analytics', 'Google Ads', 'Facebook Ads', 'Email Marketing',

        // Soft Skills
        'Leadership', 'Team Collaboration', 'Communication', 'Problem Solving',
        'Critical Thinking', 'Time Management', 'Project Management', 'Presentation Skills',
        'Conflict Resolution', 'Negotiation', 'Mentoring', 'Public Speaking',

        // Cybersecurity
        'Penetration Testing', 'Ethical Hacking', 'Network Security', 'SIEM',
        'Cryptography', 'Vulnerability Assessment', 'Security Auditing',

        // Networking
        'TCP/IP', 'DNS', 'HTTP/HTTPS', 'Load Balancing', 'CDN', 'VPN',
        'Network Architecture', 'Firewalls',

        // Blockchain & Web3
        'Blockchain', 'Ethereum', 'Solidity', 'Smart Contracts', 'Web3.js',
        'NFTs', 'DeFi', 'Cryptocurrency',

        // Other Technical
        'API Development', 'RESTful APIs', 'GraphQL', 'Microservices',
        'System Design', 'Distributed Systems', 'Scalability', 'Performance Optimization',
        'Debugging', 'Code Review', 'Technical Documentation', 'Agile Methodologies',
        'CI/CD', 'Test-Driven Development (TDD)', 'Object-Oriented Programming (OOP)',
        'Functional Programming', 'Design Patterns', 'Data Structures', 'Algorithms'
    ],

    // Work Duration
    durations: [
        'Less than 1 year', '1 year', '2 years', '3 years', '4 years', '5 years',
        '6 years', '7 years', '8 years', '9 years', '10 years', '11 years', '12 years',
        '13 years', '14 years', '15 years', '15+ years', '20+ years'
    ],

    // Graduation Years (Past 50 years + Future 10 years)
    years: Array.from({ length: 60 }, (_, i) => (new Date().getFullYear() - 50 + i).toString())
};

// ====================================================================
// LOCALSTORAGE UTILITIES FOR RECENTLY USED SUGGESTIONS
// ====================================================================

const RecentSuggestions = {
    getKey(fieldType) {
        return `recentSuggestions_${fieldType}`;
    },

    get(fieldType, limit = 5) {
        try {
            const data = localStorage.getItem(this.getKey(fieldType));
            return data ? JSON.parse(data).slice(0, limit) : [];
        } catch (e) {
            return [];
        }
    },

    add(fieldType, value) {
        try {
            const recent = this.get(fieldType, 20);
            const filtered = recent.filter(item => item.toLowerCase() !== value.toLowerCase());
            filtered.unshift(value);
            localStorage.setItem(this.getKey(fieldType), JSON.stringify(filtered.slice(0, 20)));
        } catch (e) {
            // Silently fail if localStorage is not available
        }
    }
};

// ====================================================================
// CUSTOM USER SUGGESTIONS
// ====================================================================

const CustomSuggestions = {
    getKey(fieldType) {
        return `customSuggestions_${fieldType}`;
    },

    get(fieldType) {
        try {
            const data = localStorage.getItem(this.getKey(fieldType));
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    add(fieldType, value) {
        try {
            const custom = this.get(fieldType);
            if (!custom.some(item => item.toLowerCase() === value.toLowerCase())) {
                custom.push(value);
                localStorage.setItem(this.getKey(fieldType), JSON.stringify(custom));
            }
        } catch (e) {
            // Silently fail
        }
    }
};

// ====================================================================
// FUZZY MATCHING ALGORITHM
// ====================================================================

function levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

function fuzzyMatch(input, target, threshold = 3) {
    const distance = levenshteinDistance(input.toLowerCase(), target.toLowerCase());
    return distance <= threshold;
}

// ====================================================================
// SMART RANKING SYSTEM
// ====================================================================

function rankSuggestion(suggestion, input) {
    const suggestionLower = suggestion.toLowerCase();
    const inputLower = input.toLowerCase();

    // Exact match (highest priority)
    if (suggestionLower === inputLower) {
        return 1000;
    }

    // Starts with (high priority)
    if (suggestionLower.startsWith(inputLower)) {
        return 500 + (100 - suggestion.length); // Prefer shorter matches
    }

    // Word boundary match (medium-high priority)
    const words = suggestionLower.split(/[\s\-_\/\(\)]+/);
    if (words.some(word => word.startsWith(inputLower))) {
        return 300 + (100 - suggestion.length);
    }

    // Contains (medium priority)
    if (suggestionLower.includes(inputLower)) {
        return 200 + (100 - suggestion.length);
    }

    // Fuzzy match (low priority)
    if (input.length >= 3 && fuzzyMatch(input, suggestion, 2)) {
        return 50;
    }

    return 0;
}

// ====================================================================
// ENHANCED SUGGESTION FILTERING WITH RANKING
// ====================================================================

function getSuggestions(inputValue, suggestionsArray, fieldType = '') {
    if (!inputValue || inputValue.length === 0) {
        // Return recently used suggestions when input is empty
        const recent = RecentSuggestions.get(fieldType, 5);
        return recent.length > 0 ? recent : suggestionsArray.slice(0, 10);
    }

    // Combine all suggestion sources
    const allSuggestions = [
        ...new Set([
            ...RecentSuggestions.get(fieldType),
            ...CustomSuggestions.get(fieldType),
            ...suggestionsArray
        ])
    ];

    // Filter and rank suggestions
    const rankedSuggestions = allSuggestions
        .map(suggestion => ({
            text: suggestion,
            rank: rankSuggestion(suggestion, inputValue)
        }))
        .filter(item => item.rank > 0)
        .sort((a, b) => b.rank - a.rank)
        .map(item => item.text);

    return rankedSuggestions.slice(0, 50); // Limit to top 50
}

// ====================================================================
// SEARCH HIGHLIGHTING
// ====================================================================

function highlightMatch(text, query) {
    if (!query) return text;

    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ====================================================================
// KEYBOARD NAVIGATION
// ====================================================================

function handleKeyboardNavigation(event, inputElement, suggestionsElement) {
    const suggestions = suggestionsElement.querySelectorAll('.suggestion:not(.empty-state)');

    if (suggestions.length === 0) return;

    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            currentFocusedSuggestion = Math.min(currentFocusedSuggestion + 1, suggestions.length - 1);
            updateFocusedSuggestion(suggestions);
            break;

        case 'ArrowUp':
            event.preventDefault();
            currentFocusedSuggestion = Math.max(currentFocusedSuggestion - 1, -1);
            if (currentFocusedSuggestion === -1) {
                removeFocusFromSuggestions(suggestions);
            } else {
                updateFocusedSuggestion(suggestions);
            }
            break;

        case 'Enter':
            event.preventDefault();
            if (currentFocusedSuggestion >= 0 && suggestions[currentFocusedSuggestion]) {
                suggestions[currentFocusedSuggestion].click();
            }
            break;

        case 'Escape':
            event.preventDefault();
            suggestionsElement.style.display = 'none';
            currentFocusedSuggestion = -1;
            break;

        case 'Tab':
            // Allow default tab behavior but close suggestions
            suggestionsElement.style.display = 'none';
            currentFocusedSuggestion = -1;
            break;
    }
}

function updateFocusedSuggestion(suggestions) {
    removeFocusFromSuggestions(suggestions);

    if (currentFocusedSuggestion >= 0 && suggestions[currentFocusedSuggestion]) {
        suggestions[currentFocusedSuggestion].classList.add('focused');
        suggestions[currentFocusedSuggestion].scrollIntoView({ block: 'nearest' });
    }
}

function removeFocusFromSuggestions(suggestions) {
    suggestions.forEach(suggestion => suggestion.classList.remove('focused'));
}

// ====================================================================
// ENHANCED SUGGESTION GENERATION
// ====================================================================

function generateSuggestions(inputElement, suggestionsElement, suggestionsArray, fieldType = '') {
    // Helper function to create suggestion elements with highlighting
    function createSuggestionElement(suggestion, query) {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.classList.add('suggestion');
        suggestionDiv.setAttribute('role', 'option');
        suggestionDiv.innerHTML = highlightMatch(suggestion, query);
        return suggestionDiv;
    }

    // Helper function to create empty state
    function createEmptyState() {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('suggestion', 'empty-state');
        emptyDiv.innerHTML = 'No matches found';
        return emptyDiv;
    }

    // Event handler for input
    function handleInput() {
        const inputValue = this.value.trim();
        const filteredSuggestions = getSuggestions(inputValue, suggestionsArray, fieldType);

        // Clear previous suggestions
        suggestionsElement.innerHTML = '';
        currentFocusedSuggestion = -1;

        if (filteredSuggestions.length === 0) {
            if (inputValue.length > 0) {
                // Show empty state only when user has typed something
                suggestionsElement.appendChild(createEmptyState());
                suggestionsElement.style.display = 'block';
            } else {
                suggestionsElement.style.display = 'none';
            }
            return;
        }

        // Append new suggestions with highlighting
        const fragment = document.createDocumentFragment();
        filteredSuggestions.forEach(suggestion => {
            const suggestionElement = createSuggestionElement(suggestion, inputValue);
            fragment.appendChild(suggestionElement);
        });
        suggestionsElement.appendChild(fragment);

        // Show suggestions with proper positioning
        const inputRect = inputElement.getBoundingClientRect();
        suggestionsElement.style.display = 'block';
        suggestionsElement.style.width = `${inputRect.width}px`;

        // Set ARIA attributes
        suggestionsElement.setAttribute('role', 'listbox');
        inputElement.setAttribute('aria-expanded', 'true');
        inputElement.setAttribute('aria-autocomplete', 'list');
    }

    // Event handler for blur
    function handleBlur() {
        setTimeout(() => {
            suggestionsElement.style.display = 'none';
            inputElement.setAttribute('aria-expanded', 'false');
            currentFocusedSuggestion = -1;
        }, 200);
    }

    // Event handler for focus
    function handleFocus() {
        if (this.value.trim() === '') {
            handleInput.call(this);
        }
    }

    // Event handler for keyboard navigation
    function handleKeydown(event) {
        handleKeyboardNavigation(event, inputElement, suggestionsElement);
    }

    // Attach event listeners
    inputElement.addEventListener('input', debounce(handleInput, 150)); // Reduced debounce for faster response
    inputElement.addEventListener('focus', handleFocus);
    inputElement.addEventListener('blur', handleBlur);
    inputElement.addEventListener('keydown', handleKeydown);

    // Store active elements for keyboard navigation
    inputElement.addEventListener('focus', () => {
        activeInputElement = inputElement;
        activeSuggestionsList = suggestionsElement;
    });
}

// ====================================================================
// DEBOUNCE UTILITY
// ====================================================================

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

// ====================================================================
// ENHANCED SUGGESTION CLICK HANDLER
// ====================================================================

function handleSuggestionClick(event) {
    if (!event.target.classList.contains('suggestion') || event.target.classList.contains('empty-state')) {
        return;
    }

    const suggestion = event.target.textContent.trim();
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

    // Store in recent suggestions
    const fieldId = inputField.id;
    const fieldType = getFieldTypeFromId(fieldId);
    if (fieldType) {
        RecentSuggestions.add(fieldType, suggestion);

        // Add to custom suggestions if not in default list
        const defaultList = getDefaultSuggestionsForField(fieldType);
        if (!defaultList.some(item => item.toLowerCase() === suggestion.toLowerCase())) {
            CustomSuggestions.add(fieldType, suggestion);
        }
    }
}

// Helper function to determine field type from input ID
function getFieldTypeFromId(fieldId) {
    if (fieldId.includes('degree')) return 'degrees';
    if (fieldId.includes('major')) return 'majors';
    if (fieldId.includes('school') || fieldId.includes('university')) return 'universities';
    if (fieldId.includes('year')) return 'years';
    if (fieldId.includes('position') || fieldId.includes('title')) return 'positions';
    if (fieldId.includes('company')) return 'companies';
    if (fieldId.includes('duration')) return 'durations';
    if (fieldId.includes('skill')) return 'skills';
    return '';
}

// Helper function to get default suggestions for a field type
function getDefaultSuggestionsForField(fieldType) {
    return SUGGESTION_DATA[fieldType] || [];
}

// ====================================================================
// INITIALIZE SUGGESTIONS FOR ALL FIELDS
// ====================================================================

// Attach global click handler for suggestions
document.addEventListener('click', handleSuggestionClick);

// Define input fields and their suggestion mappings
const inputsAndSuggestions = [
    { input: 'education_degree', suggestions: 'education-degree-suggestions', suggestionsArray: SUGGESTION_DATA.degrees, fieldType: 'degrees' },
    { input: 'education_major', suggestions: 'education-major-suggestions', suggestionsArray: SUGGESTION_DATA.majors, fieldType: 'majors' },
    { input: 'education_school', suggestions: 'education-school-suggestions', suggestionsArray: SUGGESTION_DATA.universities, fieldType: 'universities' },
    { input: 'education_year', suggestions: 'education-year-suggestions', suggestionsArray: SUGGESTION_DATA.years, fieldType: 'years' },
    { input: 'work_position', suggestions: 'work-position-suggestions', suggestionsArray: SUGGESTION_DATA.positions, fieldType: 'positions' },
    { input: 'work_company', suggestions: 'work-company-suggestions', suggestionsArray: SUGGESTION_DATA.companies, fieldType: 'companies' },
    { input: 'work_duration', suggestions: 'work-duration-suggestions', suggestionsArray: SUGGESTION_DATA.durations, fieldType: 'durations' },
    { input: 'skill1', suggestions: 'skill-suggestions-1', suggestionsArray: SUGGESTION_DATA.skills, fieldType: 'skills' },
    { input: 'skill2', suggestions: 'skill-suggestions-2', suggestionsArray: SUGGESTION_DATA.skills, fieldType: 'skills' },
    { input: 'skill3', suggestions: 'skill-suggestions-3', suggestionsArray: SUGGESTION_DATA.skills, fieldType: 'skills' }
];

// Generate suggestions for each input field
inputsAndSuggestions.forEach(({ input, suggestions, suggestionsArray, fieldType }) => {
    const inputElement = document.getElementById(input);
    const suggestionsElement = document.getElementById(suggestions);

    if (inputElement && suggestionsElement) {
        generateSuggestions(inputElement, suggestionsElement, suggestionsArray, fieldType);
    }
});

// ====================================================================
// EXPORT FOR TESTING (if needed)
// ====================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getSuggestions,
        rankSuggestion,
        fuzzyMatch,
        levenshteinDistance,
        RecentSuggestions,
        CustomSuggestions,
        SUGGESTION_DATA
    };
}
