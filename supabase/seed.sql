-- MMSS Job Board Seed Data
-- ===========================
-- Run this after migration to add sample data for development

-- Insert sample jobs
INSERT INTO jobs (title, company, location, work_mode, job_type, url, description, tags, posted_at, closing_at, is_active, is_featured, source) VALUES
(
  'Marketing Intern',
  'Tech Startup Co',
  'Melbourne, VIC',
  'hybrid',
  'internship',
  'https://example.com/apply/1',
  'We are looking for a motivated Marketing Intern to join our growing team. You will assist with social media management, content creation, and campaign analytics.

Responsibilities:
- Manage social media accounts
- Create engaging content
- Analyze campaign performance
- Support marketing team initiatives

Requirements:
- Currently studying Marketing or related field
- Strong communication skills
- Familiarity with social media platforms
- Basic knowledge of analytics tools',
  ARRAY['social media', 'content creation', 'analytics', 'digital marketing'],
  NOW() - INTERVAL '3 days',
  NOW() + INTERVAL '30 days',
  TRUE,
  TRUE,
  'manual'
),
(
  'Graduate Marketing Coordinator',
  'Global Brands Inc',
  'Sydney, NSW',
  'onsite',
  'graduate',
  'https://example.com/apply/2',
  'Join our marketing team as a Graduate Marketing Coordinator. This role offers excellent training and career development opportunities.

What you''ll do:
- Coordinate marketing campaigns
- Manage vendor relationships
- Track project timelines
- Support brand initiatives

What we''re looking for:
- Recent marketing graduate
- Strong organizational skills
- Excellent attention to detail
- Team player attitude',
  ARRAY['brand management', 'project coordination', 'graduate program'],
  NOW() - INTERVAL '7 days',
  NOW() + INTERVAL '21 days',
  TRUE,
  TRUE,
  'manual'
),
(
  'Social Media Specialist',
  'Creative Agency',
  'Melbourne, VIC',
  'remote',
  'part-time',
  'https://example.com/apply/3',
  'Part-time opportunity for a creative Social Media Specialist. Perfect for students looking to gain real-world experience.

About the role:
- Create and schedule social content
- Engage with community
- Monitor trends
- Report on metrics

Requirements:
- Strong copywriting skills
- Understanding of social platforms
- Creative mindset
- Available 15-20 hours/week',
  ARRAY['social media', 'copywriting', 'community management'],
  NOW() - INTERVAL '5 days',
  NOW() + INTERVAL '14 days',
  TRUE,
  FALSE,
  'manual'
),
(
  'Digital Marketing Assistant',
  'E-commerce Solutions',
  'Brisbane, QLD',
  'hybrid',
  'casual',
  'https://example.com/apply/4',
  'Casual position supporting our digital marketing efforts. Flexible hours to fit around your studies.

Tasks include:
- SEO optimization
- Email marketing support
- Content updates
- Performance tracking',
  ARRAY['SEO', 'email marketing', 'digital marketing'],
  NOW() - INTERVAL '2 days',
  NULL,
  TRUE,
  FALSE,
  'manual'
),
(
  'Marketing Analytics Intern',
  'Data Insights Ltd',
  'Melbourne, VIC',
  'onsite',
  'internship',
  'https://example.com/apply/5',
  'Internship focused on marketing analytics and data-driven decision making.

You will learn:
- Google Analytics
- Data visualization
- A/B testing
- Report creation',
  ARRAY['analytics', 'data analysis', 'google analytics', 'reporting'],
  NOW() - INTERVAL '10 days',
  NOW() + INTERVAL '5 days',
  TRUE,
  FALSE,
  'manual'
),
(
  'Content Marketing Writer',
  'Publishing House',
  'Perth, WA',
  'remote',
  'contract',
  'https://example.com/apply/6',
  '3-month contract for a talented content writer. Work remotely and build your portfolio.',
  ARRAY['content writing', 'copywriting', 'blogging'],
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '45 days',
  TRUE,
  FALSE,
  'manual'
);

-- Insert sample feedback
INSERT INTO job_feedback (job_id, type, message, email, status) VALUES
(
  (SELECT id FROM jobs WHERE title = 'Marketing Intern' LIMIT 1),
  'other',
  'Great opportunity! Applied and got an interview.',
  'student@example.com',
  'new'
),
(
  (SELECT id FROM jobs WHERE title = 'Social Media Specialist' LIMIT 1),
  'incorrect_info',
  'The location should be updated - they moved offices.',
  NULL,
  'new'
);

-- Note: To create an admin user, first create a user via Supabase Auth,
-- then run:
-- INSERT INTO admin_users (id, is_admin)
-- SELECT id, TRUE FROM auth.users WHERE email = 'your-admin@email.com';
