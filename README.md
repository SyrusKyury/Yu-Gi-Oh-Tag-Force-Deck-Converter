# Yu-Gi-Oh! Tag Force Deck Converter

## What is this?

This website allows you to modify NPC decks in the Yu-Gi-Oh! Tag Force games. The NPC decks are stored in `.ydc` files, which are binary and difficult to edit manually. With this tool, you can convert `.ydc` files to `.ydk` files that are much easier to modify using [EDOPro](https://projectignis.github.io/download.html).

## How to Use

To convert your `.ydc` file:

1. Drag and drop it into the designated box or click to upload it.
2. Click the button to download the converted file. 

The tool will automatically convert between `.ydc` and `.ydk` formats.

To view only the available cards for your game:

1. Click the "Download lflist" button to download the lflist file for your game.
2. Copy the contents of this file and paste it into the `ProjectIgnis/lflist` directory for use in EDOPro.

## FAQ

### Where can I find the `.ydc` files?

The `.ydc` files are located within the `EBOOT.bin` file of your game's ISO. 

1. Extract the `EBOOT.bin` file using a tool like [UMDGen](https://www.romhacking.net/utilities/1218/).
2. The `EBOOT.bin` file is usually found in the `SYSDIR` folder of the ISO and is encrypted.
3. To decrypt it, use a program like [decEboot](https://www.romhacking.net/utilities/1225/).
4. Once decrypted, the `EBOOT.bin` file contains all the game's data, including the NPC decks. You can extract the `.ydc` data using a tool like [YGTool](https://github.com/matheuscardoso96/YGTool).

### Why does my `.ydk` file have such a strange name?

The `.ydc` files have an 8-byte header. While this header does not affect the game, **Tag Force Deck Converter** includes it in the filename when converting to `.ydk` to ensure accurate conversion if you later convert the file back to `.ydc`.

If you convert a `.ydk` file back to `.ydc` without the header in the filename, the software will automatically set the header to `uint32 0x00000000`.

### Why use EDOPro?

EDOPro supports the `.ydk` format and includes features for anime, manga, and video game cards, as well as custom whitelists. While online editors are available, their compatibility with this tool is not guaranteed.

### Why is this a Web App?

This tool was designed as a web app to eliminate the need for downloading software. It allows you to convert files directly in your browser.

### How can I support your work?

You can support me by donating on PayPal [here](https://www.paypal.com/donate/?hosted_button_id=ETV8BCE3C6LWU).
