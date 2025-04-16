export interface FAQSection {
    title: string;
    summary: string; // The first line starting with '>' in the section, used as a summary
    content: string; // The remaining content of the section
    verbatim?: string;
}

export function parseFAQs(fileContent: string): FAQSection[] {
    const lines = fileContent.split('\n'); // Split the file into lines

    const sections: FAQSection[] = []; // Array to store parsed sections
    let currentSection: FAQSection | null = null; // Temporary variable to hold the current section being parsed

    for (const line of lines) {
        const headingMatch = line.match(/^##\s+(.*)/); // Matches headings starting with "##"
        if (headingMatch) {
            // If a new heading is found, save the current section and start a new one
            if (currentSection) {
                sections.push(currentSection);
            }
            currentSection = { title: headingMatch[1].trim(), summary: '', content: '' };
        } else if (currentSection) {
            // If the line starts with '>', treat it as the summary
            if (!currentSection.summary && line.startsWith('>')) {
                currentSection.summary = line.substring(1).trim(); // Extract summary
            } else {
                // Otherwise, append the line to the content or verbatim section
                if (line.trim().startsWith("---")) {
                    currentSection.verbatim = "";
                } else {
                    if (currentSection.verbatim !== undefined) {
                        currentSection.verbatim += line + '\n';
                    } else {
                        currentSection.content += line + '\n';
                    }
                }
            }
        }
    }

    // Push the last section if it exists
    if (currentSection) {
        sections.push(currentSection);
    }

    // Trim the content of each section and return the parsed sections
    return sections;
}
