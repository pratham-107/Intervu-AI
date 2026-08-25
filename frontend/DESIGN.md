# Browserbase

## Mission
Create implementation-ready, token-driven UI guidance for Browserbase that is optimized for consistency, accessibility, and fast delivery across marketing site.

## Brand
- Product/brand: Browserbase
- URL: https://www.browserbase.com/
- Audience: readers and knowledge seekers
- Product surface: marketing site

## Style Foundations
- Visual style: clean, functional, implementation-oriented
- Main font style: `font.family.primary=plain`, `font.family.stack=plain, plain Fallback, system-ui, Arial, sans-serif`, `font.size.base=16px`, `font.weight.base=400`, `font.lineHeight.base=24px`
- Typography scale: `font.size.xs=14px`, `font.size.sm=16px`, `font.size.md=20px`, `font.size.lg=24px`, `font.size.xl=36px`, `font.size.2xl=45px`
- Color palette: `color.surface.base=#000000`, `color.text.secondary=#ffffff`, `color.text.tertiary=#686562`, `color.surface.muted=#e2e9f3`, `color.surface.strong=#c5d3e8`
- Spacing scale: `space.1=2px`, `space.2=3.2px`, `space.3=4px`, `space.4=6px`, `space.5=7.14px`, `space.6=7.2px`, `space.7=7.6px`, `space.8=8px`
- Radius/shadow/motion tokens: `radius.xs=99px`, `radius.sm=999px` | `shadow.1=rgb(197, 211, 232) 0px -1px 0px 0px inset` | `motion.duration.instant=100ms`, `motion.duration.fast=190ms`, `motion.duration.normal=200ms`, `motion.duration.slow=300ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw hex values, in component guidance.
- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error.
- Component behavior should specify responsive and edge-case handling.
- Interactive components must document keyboard, pointer, and touch behavior.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.
- Do not ship component guidance without explicit state rules.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and semantic tokens.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Required Output Structure
- Context and goals.
- Design tokens and foundations.
- Component-level rules (anatomy, variants, states, responsive behavior).
- Accessibility requirements and testable acceptance criteria.
- Content and tone standards with examples.
- Anti-patterns and prohibited implementations.
- QA checklist.

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.
- Include known page component density: links (91), buttons (88), cards (60), lists (27), navigation (4).


## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.
