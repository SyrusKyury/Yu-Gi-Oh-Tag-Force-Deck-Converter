let cards = {};

function loadJSON(filename) {
    fetch(`json/${filename}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error("File not found");
            }
            return response.json();
        })
        .then(data => {
            cards = data;
        })
        .catch(error => {
            console.error("Error while opening JSON:", error);
        });
}

function ydc_parse(data) {
    let header = data.slice(0, 8);
    let body = data.slice(8);

    let main_deck_size = new DataView(body.buffer).getUint16(0, true);
    body = body.slice(2);

    //Print size in hex
    console.log(main_deck_size.toString(16));

    let main_deck = [];
    for (let i = 0; i < main_deck_size; i++) {
        let card_id = new DataView(body.buffer).getUint16(0, true);
        body = body.slice(2);
        main_deck.push(card_id);
    }

    let extra_deck_size = new DataView(body.buffer).getUint16(0, true);
    body = body.slice(2);

    let extra_deck = [];
    for (let i = 0; i < extra_deck_size; i++) {
        let card_id = new DataView(body.buffer).getUint16(0, true);
        body = body.slice(2);
        extra_deck.push(card_id);
    }

    let side_deck_size = new DataView(body.buffer).getUint16(0, true);
    body = body.slice(2);

    let side_deck = [];
    for (let i = 0; i < side_deck_size; i++) {
        let card_id = new DataView(body.buffer).getUint16(0, true);
        body = body.slice(2);
        side_deck.push(card_id);
    }

    return { header, main_deck, extra_deck, side_deck };
}


function ydk_parse(data) {
    let lines = data.split("\n");
    let main_deck = [];
    let extra_deck = [];
    let side_deck = [];
    let deck = null;

    for (let line of lines) {
        line = line.trim();
        if (line === "#main") {
            deck = main_deck;
        } else if (line === "#extra") {
            deck = extra_deck;
        } else if (line === "#side") {
            deck = side_deck;
        }
        else {
            deck.push(password2id(line));
        }
    }

    return {main_deck, extra_deck, side_deck };
}


function id2password(id) {
    return cards[id.toString()] || null;
}


function password2id(password) {
    for (let key in cards) {
        if (cards[key] === password) {
            return parseInt(key);
        }
    }
    return null;
}

loadJSON(document.getElementById("game-selector").value);

let currentFile = null;

// Trigger file input on click
function triggerFileInput() {
    fileInput.click();
}

// Handle file selection from input
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    handleFile(file);
});

// Handle drag-and-drop
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
    const file = event.dataTransfer.files[0];
    handleFile(file);
});

// Handle file logic
function handleFile(file) {
    if (!file) {
        fileInfo.textContent = 'No file detected. Please try again.';
        return;
    }

    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (fileExtension === 'ydk' || fileExtension === 'ydc') {
        currentFile = file;
        fileInfo.textContent = `Loaded file: ${file.name}`;
        convertBtn.style.display = 'inline-block';
        convertBtn.textContent = `Convert to .${fileExtension === 'ydk' ? 'ydc' : 'ydk'}`;
    } else {
        fileInfo.textContent = 'Invalid file type. Please upload a .ydk or .ydc file.';
        convertBtn.style.display = 'none';
    }
}

// Handle conversion
convertBtn.addEventListener('click', () => {
    if (!currentFile) return;

    const fileExtension = currentFile.name.split('.').pop().toLowerCase();
    if (fileExtension === 'ydk') {
        ydk2ydc(currentFile);
    } else if (fileExtension === 'ydc') {
        ydc2ydk(currentFile);
    }
});

// Placeholder functions for conversion
function ydk2ydc(file) {

    const reader = new FileReader();
    reader.onload = (event) => {
        const data = event.target.result;
        const {main_deck, extra_deck, side_deck } = ydk_parse(data);


        let header = 0
        //Count how many - are in the file name
        if ((file.name.match(/-/g) || []).length == 7) {
            header = file.name.replace('.ydk', '').split('-');
            header = header.map(x => parseInt(x));
        }

        
        // Create an empty buffer
        const buffer = new ArrayBuffer(8 + 2 + main_deck.length * 2 + 2 + extra_deck.length * 2 + 2 + side_deck.length * 2);
        const view = new DataView(buffer);

        
        for (let i = 0; i < 8; i++) {
            view.setUint8(i, header[i]);
        }


        // Write main deck
        view.setUint16(8, main_deck.length, true);
        let offset = 10;
        for (let card of main_deck) {
            view.setUint16(offset, card, true);
            offset += 2;
        }

        // Write extra deck
        view.setUint16(offset, extra_deck.length, true);
        offset += 2;
        for (let card of extra_deck) {
            view.setUint16(offset, card, true);
            offset += 2;
        }

        // Write side deck
        view.setUint16(offset, side_deck.length, true);
        offset += 2;
        for (let card of side_deck) {
            view.setUint16(offset, card, true);
            offset += 2;
        }

        // Create a blob and download
        const blob = new Blob([new Uint8Array(buffer)], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace('.ydk', '.ydc');
        a.click();
    };
    reader.readAsText(file);
}


function ydc2ydk(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const { header, main_deck, extra_deck, side_deck } = ydc_parse(data);

        // Create a string buffer
        let buffer = `#main\n`;
        for (let card of main_deck) {
            buffer += `${id2password(card)}\n`;
        }
        buffer += `#extra\n`;
        for (let card of extra_deck) {
            buffer += `${id2password(card)}\n`;
        }
        buffer += `#side\n`;
        for (let card of side_deck) {
            buffer += `${id2password(card)}\n`;
        }

        buffer = buffer.slice(0, -1);

        // Create a blob and download
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${header.join('-')}.ydk`;
        a.click();
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
