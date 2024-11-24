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
function handleBatchConversion(files) {
    let successCount = 0;
    let failureCount = 0;

    files.forEach((file) => {
        try {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            if (fileExtension === 'ydk') {
                ydk2ydc(file);
            } else if (fileExtension === 'ydc') {
                ydc2ydk(file);
            }
            successCount++;
        } catch (error) {
            console.error(`Failed to convert ${file.name}:`, error);
            failureCount++;
        }
    });

    fileInfo.innerHTML = `Batch conversion completed!<br>
                          Successfully converted: ${successCount}<br>
                          Failed: ${failureCount}`;
}

// Convert .ydk to .ydc
function ydk2ydc(file) {
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

        const blob = new Blob([new Uint8Array(buffer)], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result_name + `.ydc`;
        a.click();

        console.log(`${file.name} successfully converted to .ydc`);
    };
    reader.readAsText(file);
}

// Convert .ydc to .ydk
function ydc2ydk(file) {
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

        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace('.ydc', '') + `~` + `${header.join('~')}.ydk`;
        a.click();

        console.log(`${file.name} successfully converted to .ydk`);
    };
    reader.readAsArrayBuffer(file);
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
