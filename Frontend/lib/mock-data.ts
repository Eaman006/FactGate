import type { FactsResponse } from '@/lib/types'
import { normalizeFactsResponse } from '@/lib/normalize'

/**
 * Explicit development fixture — never used when live API data loads successfully.
 * Shapes match the original v0 prototype mock data.
 */
export const MOCK_FACTS_FIXTURE: FactsResponse = normalizeFactsResponse({
  facts: [
    {
      id: 'corroborated',
      name: 'Annual revenue',
      normalized_value: '$42.8M',
      source: 'Annual_Report_2025.pdf',
      snippet: 'Revenue for FY2025 was $42.8 million...',
      relationship: 'corroborated',
      confidence: '97%',
      reasoning:
        'Both documents refer to the same fiscal period and report the same normalized revenue value despite different wording.',
      context: ['Period: FY2025', 'Unit: USD', 'Scope: Consolidated'],
      sources: [
        {
          document_name: 'Annual_Report_2025.pdf',
          page: 48,
          quote:
            'Revenue for FY2025 was $42.8 million, representing a 12% increase year over year.',
        },
        {
          document_name: 'Investor_Update_Q1_2025.pdf',
          page: 6,
          quote: 'The company generated approximately $42.8M in fiscal year 2025.',
        },
      ],
    },
    {
      id: 'contradicted',
      name: 'Employee count',
      normalized_value: '1,240',
      source: 'Annual_Report_2025.pdf',
      snippet: 'As of December 31, 2025, the company had...',
      relationship: 'contradicted',
      confidence: '61%',
      reasoning:
        'Both statements appear to describe the same organization and period, but the reported values differ materially. No sufficient contextual difference is available to reconcile them.',
      context: ['Period: FY2025', 'Scope: Company-wide', 'Review: Required'],
      sources: [
        {
          document_name: 'Annual_Report_2025.pdf',
          page: 12,
          quote:
            'As of December 31, 2025, the company had 1,240 employees across its global operations.',
        },
        {
          document_name: 'Company_Profile.pdf',
          page: 3,
          quote: 'Our team has grown to 1,510 employees worldwide as of year-end 2025.',
        },
      ],
    },
    {
      id: 'resolved',
      name: 'Revenue · Q1 FY2025',
      normalized_value: '$11.2M',
      source: 'Investor_Update_Q1_2025.pdf',
      snippet: 'Revenue was $11.2M for Q1 FY2025...',
      relationship: 'context_resolved',
      confidence: '94%',
      reasoning:
        'The figures cover different reporting periods: FY2025 vs Q1 FY2025. The values are not directly comparable, so the apparent conflict is resolved by context.',
      context: ['Period: FY2025 vs Q1 FY2025', 'Scope: Full year vs quarter', 'Unit: USD'],
      sources: [
        {
          document_name: 'Annual_Report_2025.pdf',
          page: 48,
          quote:
            'Revenue for FY2025 was $42.8M, reflecting the full twelve-month reporting period.',
        },
        {
          document_name: 'Investor_Update_Q1_2025.pdf',
          page: 5,
          quote: 'Revenue was $11.2M for Q1 FY2025, a strong start to the fiscal year.',
        },
      ],
    },
    {
      id: 'margin',
      name: 'Operating margin',
      normalized_value: '18.4%',
      source: 'Annual_Report_2025.pdf',
      snippet: 'Operating margin expanded to 18.4%...',
      relationship: 'corroborated',
      confidence: '91%',
      sources: [
        {
          document_name: 'Annual_Report_2025.pdf',
          page: 52,
          quote: 'Operating margin expanded to 18.4% during the fiscal year.',
        },
      ],
    },
    {
      id: 'founded',
      name: 'Company founded',
      normalized_value: '2014',
      source: 'Company_Profile.pdf',
      snippet: 'Founded in 2014 by a team of...',
      relationship: 'corroborated',
      confidence: '99%',
      sources: [
        {
          document_name: 'Company_Profile.pdf',
          page: 1,
          quote: 'Founded in 2014 by a team of industry veterans.',
        },
      ],
    },
    {
      id: 'review',
      name: 'Employee count candidate',
      normalized_value: '1,240',
      source: 'Company_Profile.pdf',
      snippet: 'Headcount 1,240 / projected 1,510...',
      relationship: 'needs_review',
      confidence: '38%',
      needs_review: true,
      reasoning:
        'The extraction model could not confidently determine whether “1,240” refers to current employees or projected headcount. The system avoided asserting an uncertain fact.',
      context: ['Source: OCR-like table', 'Field: Ambiguous', 'Action: Review source'],
      sources: [
        {
          document_name: 'Company_Profile.pdf',
          page: 9,
          quote: 'Headcount 1,240 / projected 1,510 ... [table alignment unclear]',
        },
        {
          document_name: 'Annual_Report_2025.pdf',
          page: 12,
          quote: 'The company had 1,240 employees across its global operations.',
        },
      ],
    },
  ],
  documents: [
    {
      name: 'Annual_Report_2025.pdf',
      status: 'Complete',
      date: 'Today, 09:42',
      facts: 31,
      issues: 2,
      relationships: 11,
    },
    {
      name: 'Investor_Update_Q1_2025.pdf',
      status: 'Complete',
      date: 'Today, 09:38',
      facts: 12,
      issues: 1,
      relationships: 5,
    },
    {
      name: 'Company_Profile.pdf',
      status: 'Processing',
      date: 'Today, 09:31',
      facts: 5,
      issues: 1,
      relationships: 1,
    },
  ],
  summary: {
    total_facts: 48,
    total_documents: 3,
    complete_documents: 2,
    processing_documents: 1,
    relationships_found: 17,
    corroborated: 12,
    resolved: 3,
    contradicted: 1,
    needs_review: 4,
    groundedness_score: 92,
  },
})
