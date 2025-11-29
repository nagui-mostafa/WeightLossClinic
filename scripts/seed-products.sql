INSERT INTO weight_loss_products
  (id, token, name, href, "hrefForm", "oldPrice", price, popular, "inStock", badge, description, shipping, instructions, "sideEffects", features, "whyChoose", plan, question, "howItWorks", images, metadata)
VALUES
  (
    '3fd8c1b3-924c-4a0c-bce2-9f6e0d5b7a01',
    'glp1-core-plan',
    'GLP-1 Core - Injection',
    '/weight-loss/glp1-core-plan',
    'wLinkForm',
    279,
    199,
    true,
    true,
    'Clinician-guided GLP-1 program (Semaglutide)',
    'A GLP-1 core plan (Semaglutide) designed to support steady weight loss, appetite control, and metabolic balance with weekly injections.',
    'Ships in 1-2 days - Free delivery over $40',
    'Inject once weekly as directed by your provider. Follow the titration schedule and do not exceed the prescribed dose.',
    'Possible nausea, GI upset, or headache. Effects are usually mild and temporary. Contact your provider if severe.',
    ARRAY['GLP-1 support with weekly dosing','Focus on appetite and satiety','Provider-guided titration schedule'],
    '[
      {"title":"Clinician-guided","excerpt":"Structured plan with check-ins","imgSrc":"/images/weight-loss/products/1.jpg"},
      {"title":"Appetite control","excerpt":"Helps reduce cravings","imgSrc":"/images/weight-loss/products/2.jpg"},
      {"title":"Steady progress","excerpt":"Built for sustainable loss","imgSrc":"/images/weight-loss/products/3.jpg"}
    ]'::jsonb,
    '[
      {"id":"1","title":"4 Week","price":199,"oldPrice":279,"href":"https://pay.joeymed.com/b/fZueV6cY7eXLfJee337wA0n"},
      {"id":"2","title":"8 Weeks","price":299,"oldPrice":440,"href":"https://pay.joeymed.com/b/dRmeV68HRcPDbsY0cd7wA0t"},
      {"id":"3","title":"12 Week Elite","price":399,"oldPrice":599,"href":"https://pay.joeymed.com/b/9B69AM5vFcPD0Ok9MN7wA0u"}
    ]'::jsonb,
    '[
      {"title":"What is this plan?","description":"A weekly GLP-1 program designed to support steady weight loss with provider oversight and lifestyle guidance."},
      {"title":"How do I use it?","description":"Inject once per week as instructed. Stay consistent with your dosing day and follow your nutrition plan."},
      {"title":"Side effects?","description":"Mild nausea or GI upset can occur and often fades. Seek help if symptoms are severe or persistent."}
    ]'::jsonb,
    '[
      {"step":1,"title":"Start weekly dosing","description":"Begin with a starter dose and follow your titration plan."},
      {"step":2,"title":"Support habits","description":"Pair with nutrition, hydration, and daily movement."},
      {"step":3,"title":"Track results","description":"Review progress with your provider and adjust as needed."}
    ]'::jsonb,
    '[
      {"id":"glp1-core-plan-hero","bucket":"weight-loss-media","objectKey":"weight-loss/products/glp1-core/hero.png","altText":"GLP-1 Core hero art","fallbackUrl":"/images/weight-loss/products/GLP-1 Core.png","variant":"hero"},
      {"id":"glp1-core-plan-alt-1","bucket":"weight-loss-media","objectKey":"weight-loss/products/glp1-core/detail-1.png","altText":"GLP-1 Core detail 1","fallbackUrl":"/images/weight-loss/products/GLP-1 Core.png","variant":"detail"},
      {"id":"glp1-core-plan-alt-2","bucket":"weight-loss-media","objectKey":"weight-loss/products/glp1-core/detail-2.png","altText":"GLP-1 Core detail 2","fallbackUrl":"/images/weight-loss/products/GLP-1 Core.png","variant":"detail"}
    ]'::jsonb,
    '{"category":"glp-1","displayOrder":1}'::jsonb
  )
ON CONFLICT (token) DO UPDATE SET
  name = EXCLUDED.name,
  href = EXCLUDED.href,
  "hrefForm" = EXCLUDED."hrefForm",
  "oldPrice" = EXCLUDED."oldPrice",
  price = EXCLUDED.price,
  popular = EXCLUDED.popular,
  "inStock" = EXCLUDED."inStock",
  badge = EXCLUDED.badge,
  description = EXCLUDED.description,
  shipping = EXCLUDED.shipping,
  instructions = EXCLUDED.instructions,
  "sideEffects" = EXCLUDED."sideEffects",
  features = EXCLUDED.features,
  "whyChoose" = EXCLUDED."whyChoose",
  plan = EXCLUDED.plan,
  question = EXCLUDED.question,
  "howItWorks" = EXCLUDED."howItWorks",
  images = EXCLUDED.images,
  metadata = EXCLUDED.metadata;

INSERT INTO weight_loss_products
  (id, token, name, href, "hrefForm", "oldPrice", price, popular, "inStock", badge, description, shipping, instructions, "sideEffects", features, "whyChoose", plan, question, "howItWorks", images, metadata)
VALUES
  (
    '3fd8c1b3-924c-4a0c-bce2-9f6e0d5b7a02',
    'glp1-plus-core-plan',
    'GLP-1 Plus Core - Injection',
    '/weight-loss/glp1-plus-core-plan',
    'wLinkForm',
    399,
    279,
    false,
    true,
    'Enhanced guidance and follow-ups (Tirzepatide)',
    'An enhanced GLP-1 (Tirzepatide) plan with weekly injections, added provider follow-ups, and lifestyle coaching support for stronger adherence.',
    'Ships in 1-2 days - Free delivery over $40',
    'Inject weekly on a consistent day. Attend scheduled check-ins and follow your titration and nutrition plan.',
    'Potential nausea, stomach upset, or headache. Typically transient; contact your provider if persistent or severe.',
    ARRAY['Weekly GLP-1 injections','Extra provider follow-ups','Lifestyle and adherence support'],
    '[
      {"title":"More support","excerpt":"Added check-ins for accountability","imgSrc":"/images/weight-loss/products/1.jpg"},
      {"title":"Personalized tweaks","excerpt":"Dosing adjusted to your response","imgSrc":"/images/weight-loss/products/2.jpg"},
      {"title":"Clear roadmap","excerpt":"Structured plan to stay on track","imgSrc":"/images/weight-loss/products/3.jpg"}
    ]'::jsonb,
    '[
      {"id":"5","title":"4 Weeks","price":279,"oldPrice":379,"href":"https://pay.joeymed.com/b/eVq6oA9LVeXL68E1gh7wA0p"},
      {"id":"6","title":"8 Weeks","price":399,"oldPrice":458,"href":"https://pay.joeymed.com/b/aFa6oA6zJ8zn2Ws4st7wA0v"},
      {"id":"7","title":"12 Week Elite","price":499,"oldPrice":589,"href":"https://pay.joeymed.com/b/aFacMYbU36rf68E5wx7wA0A"}
    ]'::jsonb,
    '[
      {"title":"What is different vs Core?","description":"You receive more frequent provider follow-ups and added coaching support to help maintain momentum."},
      {"title":"How do I get started?","description":"Complete your intake, get approved, and begin weekly injections with an adherence plan and check-ins."},
      {"title":"Any diet rules?","description":"Focus on protein, hydration, and fiber-rich foods. Your provider may share a simple weekly nutrition target."}
    ]'::jsonb,
    '[
      {"step":1,"title":"Intake and approval","description":"Complete intake and provider review."},
      {"step":2,"title":"Weekly dosing","description":"Follow your injection plus titration schedule."},
      {"step":3,"title":"Check-ins","description":"Use follow-ups to fine-tune and stay consistent."}
    ]'::jsonb,
    '[
      {"id":"glp1-plus-core-hero","bucket":"weight-loss-media","objectKey":"weight-loss/products/glp1-plus-core/hero.png","altText":"GLP-1 Plus Core hero art","fallbackUrl":"/images/weight-loss/products/GLP-1 Plus Core.png","variant":"hero"},
      {"id":"glp1-plus-core-alt-1","bucket":"weight-loss-media","objectKey":"weight-loss/products/glp1-plus-core/detail-1.png","altText":"GLP-1 Plus Core detail 1","fallbackUrl":"/images/weight-loss/products/GLP-1 Plus Core.png","variant":"detail"}
    ]'::jsonb,
    '{"category":"glp-1","displayOrder":2}'::jsonb
  )
ON CONFLICT (token) DO UPDATE SET
  name = EXCLUDED.name,
  href = EXCLUDED.href,
  "hrefForm" = EXCLUDED."hrefForm",
  "oldPrice" = EXCLUDED."oldPrice",
  price = EXCLUDED.price,
  popular = EXCLUDED.popular,
  "inStock" = EXCLUDED."inStock",
  badge = EXCLUDED.badge,
  description = EXCLUDED.description,
  shipping = EXCLUDED.shipping,
  instructions = EXCLUDED.instructions,
  "sideEffects" = EXCLUDED."sideEffects",
  features = EXCLUDED.features,
  "whyChoose" = EXCLUDED."whyChoose",
  plan = EXCLUDED.plan,
  question = EXCLUDED.question,
  "howItWorks" = EXCLUDED."howItWorks",
  images = EXCLUDED.images,
  metadata = EXCLUDED.metadata;

INSERT INTO weight_loss_products
  (id, token, name, href, "hrefForm", "oldPrice", price, popular, "inStock", badge, description, shipping, instructions, "sideEffects", features, "whyChoose", plan, question, "howItWorks", images, metadata)
VALUES
  (
    '3fd8c1b3-924c-4a0c-bce2-9f6e0d5b7a03',
    'lipo-mic-ultraburn',
    'Lipo MIC UltraBurn - Injection',
    '/weight-loss/lipo-mic-ultraburn',
    'wLinkForm',
    199,
    89,
    false,
    true,
    'Metabolism and energy support',
    'A Lipo MIC blend to support fat metabolism and energy alongside your nutrition and movement plan.',
    'Ships in 1-2 days - Free delivery over $40',
    'Use as directed by your provider. Follow the recommended schedule and pair with diet and activity guidance.',
    'Generally well-tolerated; mild injection-site discomfort possible. Contact your provider if you experience unusual symptoms.',
    ARRAY['Lipo MIC (lipotropics) blend','Supports fat metabolism and energy','Provider-guided schedule'],
    '[
      {"title":"Metabolic nudge","excerpt":"Designed to complement weight efforts","imgSrc":"/images/weight-loss/products/1.jpg"},
      {"title":"Convenient cadence","excerpt":"Simple provider-guided schedule","imgSrc":"/images/weight-loss/products/2.jpg"},
      {"title":"Pairs with GLP-1","excerpt":"Use alongside diet and movement","imgSrc":"/images/weight-loss/products/3.jpg"}
    ]'::jsonb,
    '[
      {"id":"5","title":"4 Weeks","price":60,"oldPrice":120,"href":"https://pay.joeymed.com/b/4gM7sEaPZg1P40waQR7wA0w"},
      {"id":"6","title":"8 Weeks","price":100,"oldPrice":160,"href":"https://pay.joeymed.com/b/28E28kf6fbLz68Egbb7wA0x"},
      {"id":"7","title":"12 Week Elite","price":120,"oldPrice":200,"href":"https://pay.joeymed.com/b/00w5kw3nxcPD9kQ1gh7wA0y"}
    ]'::jsonb,
    '[
      {"title":"What is Lipo MIC?","description":"A combination of lipotropic compounds used to support fat metabolism and energy as part of a broader plan."},
      {"title":"How is it used?","description":"Administer on the schedule provided by your clinician. Keep consistent nutrition, hydration, and activity."},
      {"title":"Can I combine with GLP-1?","description":"Often used alongside lifestyle and other therapies. Always follow your provider''s guidance."}
    ]'::jsonb,
    '[
      {"step":1,"title":"Provider plan","description":"Confirm your dosing cadence and goals."},
      {"step":2,"title":"Stay consistent","description":"Follow the schedule and log how you feel."},
      {"step":3,"title":"Review and adjust","description":"Share progress; your plan can be refined."}
    ]'::jsonb,
    '[
      {"id":"lipo-ultraburn-hero","bucket":"weight-loss-media","objectKey":"weight-loss/products/lipo-mic-ultraburn/hero.png","altText":"Lipo MIC UltraBurn hero art","fallbackUrl":"/images/weight-loss/products/Lipo MIC Ultraburn.png","variant":"hero"}
    ]'::jsonb,
    '{"category":"mic","displayOrder":3}'::jsonb
  )
ON CONFLICT (token) DO UPDATE SET
  name = EXCLUDED.name,
  href = EXCLUDED.href,
  "hrefForm" = EXCLUDED."hrefForm",
  "oldPrice" = EXCLUDED."oldPrice",
  price = EXCLUDED.price,
  popular = EXCLUDED.popular,
  "inStock" = EXCLUDED."inStock",
  badge = EXCLUDED.badge,
  description = EXCLUDED.description,
  shipping = EXCLUDED.shipping,
  instructions = EXCLUDED.instructions,
  "sideEffects" = EXCLUDED."sideEffects",
  features = EXCLUDED.features,
  "whyChoose" = EXCLUDED."whyChoose",
  plan = EXCLUDED.plan,
  question = EXCLUDED.question,
  "howItWorks" = EXCLUDED."howItWorks",
  images = EXCLUDED.images,
  metadata = EXCLUDED.metadata;
