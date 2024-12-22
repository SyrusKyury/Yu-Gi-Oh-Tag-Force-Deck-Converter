let currentFiles = []; // Array to store multiple files

// Trigger file input on click
function triggerFileInput() {
    fileInput.click();
}

// Handle file selection from input
fileInput.addEventListener('change', (event) => {
    const files = Array.from(event.target.files); // Get all selected files
    handleFiles(files);
});

// Handle drag-and-drop for multiple files
dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.style.background = 'rgba(255, 255, 255, 0.2)';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.background = 'rgba(255, 255, 255, 0.1)';
});

dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.style.background = 'rgba(255, 255, 255, 0.1)';
    const files = Array.from(event.dataTransfer.files); // Get all dropped files
    handleFiles(files);
});

// Handle multiple files
function handleFiles(files) {
    if (!files || files.length === 0) {
        fileInfo.innerHTML = 'No files detected. Please try again.';
        return;
    }

    currentFiles = []; // Reset the current files array
    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (fileExtension === 'ydk' || fileExtension === 'ydc') {
            validFiles.push(file);
        } else {
            invalidFiles.push(file.name);
        }
    });

    fileInfo.innerHTML = ''; // Clear the file info container
    fileInfo.hidden = false;
    if (validFiles.length > 0) {
        currentFiles = validFiles;

        // Populate the scrollable container with valid file names
        const fileList = validFiles.map(f => `${f.name}`).join('<br>');
        fileInfo.innerHTML = `<center>${fileList}</center>`;
        convertBtn.style.display = 'inline-block';
        convertBtn.textContent = `Convert ${validFiles.length} Files`;
        convertBtn.onclick = () => handleBatchConversion(currentFiles);
    } else {
        fileInfo.innerHTML = 'No valid files detected. Please upload .ydk or .ydc files.';
        convertBtn.style.display = 'none';
    }

    if (invalidFiles.length > 0) {
        console.warn('Invalid files:', invalidFiles);
    }
}

// Handle batch conversion
async function handleBatchConversion(files) {
    const zip = new JSZip();
    const ydcFolder = zip.folder('ydc');
    const ydkFolder = zip.folder('ydk');

    let successCount = 0;
    let failureCount = 0;

    for (const file of files) {
        try {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            if (fileExtension === 'ydk') {
                const result = await ydk2ydc(file); // Await the Promise
                ydcFolder.file(result[0], result[1]);
            } else if (fileExtension === 'ydc') {
                const result = await ydc2ydk(file); // Await the Promise
                ydkFolder.file(result[0], result[1]);
            }
            successCount++;
        } catch (error) {
            console.error(`Failed to convert ${file.name}:`, error);
            failureCount++;
        }
    }

    zip.generateAsync({ type: 'blob' }).then((content) => {
        saveAs(content, 'ygo-deck-converter.zip');
    });

    fileInfo.innerHTML = `Batch conversion completed!<br>
                          Successfully converted: ${successCount}<br>
                          Failed: ${failureCount}`;
}

// Convert .ydk to .ydc
function ydk2ydc(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = event.target.result;
            const { main_deck, extra_deck, side_deck } = ydk_parse(data);

            let header = 0;
            let result_name = file.name.replace('.ydk', '');
            if ((file.name.match(/~/g) || []).length == 8) {
                header = result_name.split('~');
                result_name = header[0];
                header = header.slice(1).map(x => parseInt(x));
            }

            const buffer = new ArrayBuffer(8 + 2 + main_deck.length * 2 + 2 + extra_deck.length * 2 + 2 + side_deck.length * 2);
            const view = new DataView(buffer);

            for (let i = 0; i < 8; i++) {
                view.setUint8(i, header[i]);
            }

            view.setUint16(8, main_deck.length, true);
            let offset = 10;
            main_deck.forEach(card => {
                view.setUint16(offset, card, true);
                offset += 2;
            });

            view.setUint16(offset, extra_deck.length, true);
            offset += 2;
            extra_deck.forEach(card => {
                view.setUint16(offset, card, true);
                offset += 2;
            });

            view.setUint16(offset, side_deck.length, true);
            offset += 2;
            side_deck.forEach(card => {
                view.setUint16(offset, card, true);
                offset += 2;
            });

            const filename = result_name + `.ydc`;
            resolve([filename, buffer]);
        };

        reader.onerror = () => {
            reject(`Failed to read file ${file.name}`);
        };

        reader.readAsText(file);
    });
}

// Convert .ydc to .ydk
function ydc2ydk(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const { header, main_deck, extra_deck, side_deck } = ydc_parse(data);

            let buffer = `#main\n`;
            main_deck.forEach(card => buffer += `${id2password(card)}\n`);
            buffer += `#extra\n`;
            extra_deck.forEach(card => buffer += `${id2password(card)}\n`);
            buffer += `!side\n`;
            side_deck.forEach(card => buffer += `${id2password(card)}\n`);

            const filename = file.name.replace('.ydc', '') + `~` + `${header.join('~')}.ydk`;
            resolve([filename, buffer]);
        };

        reader.onerror = () => {
            reject(`Failed to read file ${file.name}`);
        };

        reader.readAsArrayBuffer(file);
    });
}

// Handle download link
gameSelector.addEventListener('change', () => {
    const selectedGame = gameSelector.value;
    downloadLink.href = `lflists/${selectedGame}.lflist.conf`;
    downloadLink.download = `${selectedGame}.lflist.conf`;
    cards = loadJSON(selectedGame);
});

// Start gameSelector with default value
const selectedGame = gameSelector.value;
downloadLink.href = `lflists/${selectedGame}.lflist.conf`;
downloadLink.download = `${selectedGame}.lflist.conf`;
