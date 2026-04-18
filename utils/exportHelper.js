// @ts-check
import fs from 'fs';
import path from 'path';

/**
 * Saves the winning property data to a JSON file inside the /output directory.
 * The filename is dynamically generated using the Category, Test Case name and a timestamp.
 * 
 * @param {string} category 
 * @param {string} testName 
 * @param {Object} data 
 * @returns {string} The path to the saved file
 */
export function exportWinnerData(category, testName, data) {
    // Sanitize the names to be filesystem-friendly
    const safeCategory = category.replace(/[^a-zA-Z0-9]/g, '_');
    const safeTestName = testName.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Ensure the output directory exists
    const outputDir = path.resolve(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the JSON file
    const fileName = `${safeCategory}_${safeTestName}_${timestamp}.json`;
    const filePath = path.join(outputDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf-8');
    console.log(`--- Saved winner details successfully to: ${filePath}`);
    
    return filePath;
}
