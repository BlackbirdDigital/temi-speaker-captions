/**
 * Temi Speaker Captions
 *
 * Ingest a txt file from Temi and output an srt file of speaker names.
 */

const args = process.argv.slice(2);

if (args.length < 2) {
	console.log('Usage: node index.js <input file> <output file>');
	process.exit(1);
}

const fs = require('fs');
const path = require('path');
const moment = require('moment');
require('moment-duration-format');

const input = args[0];
const output = args[1];

const inputPath = path.resolve(input);
const outputPath = path.resolve(output);

const inputDir = path.dirname(inputPath);
const outputDir = path.dirname(outputPath);

const inputExt = path.extname(inputPath);
const outputExt = path.extname(outputPath);

if (inputExt !== '.txt') {
	console.log('Input file must be a .txt file');
	process.exit(1);
}

if (outputExt !== '.srt') {
	console.log('Output file must be a .srt file');
	process.exit(1);
}

if (!fs.existsSync(inputPath)) {
	console.log('Input file does not exist');
	process.exit(1);
}

if (!fs.existsSync(outputDir)) {
	console.log('Output directory does not exist');
	process.exit(1);
}

const inputName = path.basename(inputPath, inputExt);
const outputName = path.basename(outputPath, outputExt);

const inputText = fs.readFileSync(inputPath, 'utf8');

const lines = inputText.split(/\r?\n/);

console.log(`Parsing ${lines.length} lines from ${inputPath}`);

const outputLines = [];

let index = 0;
let lastSpeaker = null;
let lastSpeakerTime = null;

for (let i = 0; i < lines.length; i++) {
	const line = lines[i];

	//console.log('line:', `"${line}"`);

	// Speaker lines start with the name and end with the timestamp in the format (hh:mm:ss) and a colon.
	if (line.endsWith('):')) {
		console.log('found speaker line:', line);
		const time = line.substring(line.indexOf('(') + 1, line.indexOf(')'));
		console.log('time:', time);
		// Speaker name proceeds the timestamp separated by a space.
		const speaker = line.substring(0, line.indexOf(' ('));
		console.log('speaker:', speaker);

		if (speaker !== lastSpeaker) {
			console.log('outputting caption');
			// If the speaker has changed, output a caption that includes the index, the last speaker's name, and the time range.
			if (lastSpeaker !== null) {
				outputLines.push(++index);
				outputLines.push(`${lastSpeakerTime} --> ${time}`);
				outputLines.push(lastSpeaker);
				outputLines.push('');
			}

			lastSpeaker = speaker;
			lastSpeakerTime = time;
		}
	}

	// If this is the last line, output the last speaker's caption.
	if (i === lines.length - 1) {
		// Assume the final speaker spoke for a full minute, since we don't have an end time.
		const time = moment
			.duration(lastSpeakerTime)
			.add(1, 'minute')
			.format('hh:mm:ss');
		outputLines.push(++index);
		outputLines.push(`${lastSpeakerTime} --> ${time}`);
		outputLines.push(lastSpeaker);
		outputLines.push('');
	}
}

const outputText = outputLines.join('\n');

fs.writeFileSync(outputPath, outputText, 'utf8');

console.log(`Wrote ${outputLines.length / 4} captions to ${outputPath}`);

process.exit(0);
