import * as XLSX from 'xlsx'

const COLUMNS = [
  'Title',
  'Company',
  'Application URL',
  'Location',
  'Work Mode',
  'Job Type',
  'Description',
  'Tags',
  'Company Logo URL',
  'Posted Date',
  'Closing Date',
  'Featured',
  'Active',
]

const SAMPLE_DATA = [
  [
    'Marketing Intern',
    'Acme Corp',
    'https://acme.com/apply',
    'Melbourne, VIC',
    'hybrid',
    'internship',
    'Join our marketing team for an exciting internship opportunity.',
    'marketing, social media, content',
    'https://acme.com/logo.png',
    '2026-03-15',
    '2026-04-30',
    'no',
    'yes',
  ],
  [
    'Graduate Software Engineer',
    'TechStart',
    'https://techstart.io/careers',
    'Sydney, NSW',
    'remote',
    'graduate',
    'Build amazing products with our engineering team.',
    'software, engineering, javascript',
    '',
    '2026-03-10',
    '',
    'yes',
    'yes',
  ],
]

export function generateTemplate(): ArrayBuffer {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Instructions & Sample
  const instructionsData = [
    ['MMSS Job Board - Bulk Import Template'],
    [],
    ['INSTRUCTIONS'],
    ['1. Go to the "Job Data" sheet (tab at the bottom) to enter your job postings.'],
    ['2. Each row = one job posting. Fill in the columns as described below.'],
    ['3. Required fields: Title, Company, Application URL. All others are optional.'],
    ['4. Save the file and upload it back on the admin page.'],
    [],
    ['COLUMN REFERENCE'],
    ['Column', 'Required', 'Description', 'Accepted Values'],
    ['Title', 'Yes', 'The job title', 'Any text'],
    ['Company', 'Yes', 'Company name', 'Any text'],
    ['Application URL', 'Yes', 'Link where candidates apply', 'Valid URL (https://...)'],
    ['Location', 'No', 'Job location', 'e.g. Melbourne, VIC'],
    ['Work Mode', 'No', 'Working arrangement', 'remote, hybrid, or onsite'],
    ['Job Type', 'No', 'Employment type', 'internship, graduate, part-time, full-time, casual, or contract'],
    ['Description', 'No', 'Job description text', 'Plain text (HTML not supported in bulk import)'],
    ['Tags', 'No', 'Comma-separated skill/topic tags', 'e.g. marketing, social media, content'],
    ['Company Logo URL', 'No', 'URL to company logo image', 'Valid URL (https://...)'],
    ['Posted Date', 'No', 'Date job was posted', 'YYYY-MM-DD format'],
    ['Closing Date', 'No', 'Application closing date', 'YYYY-MM-DD format'],
    ['Featured', 'No', 'Highlight on homepage', 'yes or no (default: no)'],
    ['Active', 'No', 'Visible to public', 'yes or no (default: yes)'],
    [],
    ['SAMPLE DATA (for reference only — enter your data in the "Job Data" sheet)'],
    COLUMNS,
    ...SAMPLE_DATA,
  ]

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData)

  // Set column widths for readability
  wsInstructions['!cols'] = [
    { wch: 22 },
    { wch: 12 },
    { wch: 45 },
    { wch: 55 },
  ]

  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions')

  // Sheet 2: Job Data (for user input)
  const jobDataSheet = [COLUMNS]
  const wsJobData = XLSX.utils.aoa_to_sheet(jobDataSheet)

  wsJobData['!cols'] = COLUMNS.map((col) => ({
    wch: Math.max(col.length + 4, 18),
  }))

  XLSX.utils.book_append_sheet(wb, wsJobData, 'Job Data')

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
}
