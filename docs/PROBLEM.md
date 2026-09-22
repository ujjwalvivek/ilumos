![][image1]

Lumenci AI \- Product Manager Assignment

**Overview**

**Deadline:** 24 hours from when you receive this email

**Submission:** Via form provided separately in the email

**The Challenge**

iLumos is an AI-powered chat interface for patent infringement analysis. Patent analysts upload claim charts (tables that map patent claims to accused product features with supporting evidence), then use conversational AI to refine them by improving accuracy and strengthening evidence. The refined charts are exported to Word for legal proceedings.

**Your task:** Design and prototype the AI chat-based claim chart refinement experience.

**Sample Claim Chart Structure**

**Background:** A patent claim is a legal statement that defines what the patent protects. Each claim is broken down into claim elements \- the individual components or steps that together describe the invention. In infringement analysis, analysts create claim charts that map each claim element from the patent to corresponding features in the accused product, providing evidence that shows how the product practices (infringes) the patented invention.

**Example:** Patent US123456 vs. Acme Corp Thermostat claim chart

| Patent Claim Element Accused Product Feature AI Reasoning (Evidence)                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A temperature control** Acme Thermostat product The Acme device has WiFi **device with a wireless** page states: "WiFi-enabled capability which satisfies the **communication module** smart thermostat connects to wireless communication your home network" module requirement                                   |
| **A motion sensor for** Acme technical specifications Motion sensor explicitly **detecting occupancy** document shows: "Built-in mentioned in specs directly motion sensor detects when maps to the claim element for people are home" occupancy detection                                                           |
| **Machine learning algorithm** Acme marketing materials The learning behavior **that learns user** claim: "Auto-Schedule learns described suggests ML **temperature preferences** your preferred temperatures" algorithm, though technical **over time** implementation details are not disclosed. May need stronger |

| technical evidence. |
| ------------------: |

Common refinement scenarios analysts face:

• Strengthen evidence \- "Add technical documentation for the motion sensor claim" • Fix weak reasoning \- "The AI reasoning for element 3 is vague, need more specific technical analysis"

• Add missing features \- "AI missed that Acme also has a temperature sensor array" • Clarify legal language \- "Rewrite the reasoning to address potential claim construction arguments"

**What to Submit**

**1\. User Flow Diagram**

Create a flowchart showing: How analysts upload claim chart to the chat interface, How they use conversational prompts to request refinements (e.g., "Strengthen the evidence for element 2"), How AI responds with suggestions in the chat, How analysts review and iterate through chat, How they export the final refined chart.

Include 3 edge cases: AI gives wrong evidence (analyst corrects via chat), User wants to undo a previous refinement, AI cannot find evidence (asks analyst for guidance in chat to upload technical documentation or URL for the web scraping).

**Tool:** Mermaid, Figma, Lucidchart, or any diagramming tool

**Share:** Public link or image file

**2\. Working Prototype**

Build a functional chat-based demo. You can use any LLM-based vibe coding tool (Claude Artifacts, ChatGPT Canvas, v0.dev, Replit, Cursor, Bolt, Lovable, etc.).

**Requirements:** Show user starting to engage with product \- uploading documents (claim chart, product docs), setting system prompts or instructions, Display the 3-column claim chart in the interface, User sends chat message requesting refinement (example: "The AI reasoning for the ML algorithm element is weak \- add more technical details"), AI responds in chat with specific suggestions for better reasoning or evidence, User can accept/reject/modify through continued conversation, Updated claim chart is displayed showing changes.

Focus on the end-to-end user experience including initial setup. Skip authentication. **Share:** Published link

**3\. Product Requirements Document (1 page)**

Write a concise 1-page PRD in MS Word/Google doc format covering:  

• Problem Statement \- What pain point are we solving?

• User Stories \- Format: "As a patent analyst, I want to..."

• Core Features \- What chat capabilities are in MVP scope? What is out of scope? Key Decisions \- 2-3 critical choices you made and why

• Acceptance Criteria \- Specific testable criteria

• Success Metrics \- How will you measure success?

**Share:** Public link or upload file  

**4\. Video Walkthrough (Under 3 minutes)**

Record a concise video walkthrough covering:

• User flow (1 min) \- Walk through your diagram from upload to export

• Prototype demo (2 min) \- Show the working demo in action, including document upload, chat interaction, and refinement

**Format:** Loom, YouTube unlisted, or Google Drive etc;

Tip: Keep it fast-paced and focused on the core interaction

**Share:** Public link or upload file

**Submission Instructions**

Complete the form with links to all four deliverables. Ensure all links are publicly accessible.

**Guidelines**

You CAN:

• Use any LLMs or AI vibe coding tools to build your prototype

• Make reasonable assumptions about conversational patterns (document them in your PRD) • Focus on core chat refinement interaction

• Use our sample claim chart or create mock data

• Keep it scrappy \- we value thinking over polish

You do NOT need to:

• Build production-ready prototype

• Handle complex file parsing logic

• Create pixel-perfect UI

**Important Notes**

**No Q\&A:** We will not answer questions during the 24-hour window. Make decisions with incomplete information and document your assumptions.

**Originality:** Using AI tools for coding is fine, but product thinking must be yours.

**Bonus points for**: Understanding LLM limitations in chat contexts, Proposing chat-specific quality evaluation methods, Human-in-the-loop conversational patterns, Creative chat UX solutions.

Show us how you think about conversational AI products, user workflows, and execution. Good luck\!

[image1]: data:image/png;base64,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
