# StarRegistryNotary
Udacity Project 4, Notary / Star Registry

## General Info regarding Web API 
1. ExpressJS for Backend
2. LevelDB for database
3. Directory chaindata contains 20 blocks of valid data
4. Port is 8000

## Genera Installation Instructions
1. GitHub: 
2. BEFORE running npm install, run": npm install --save  --ignore-scripts bitcoinjs-lib
    This is due to a dependency in this package requiring local compilation that's not really required.
3. Run npm install
4. Execute via node (or nodemon) app.js
5. Runs on localhost:8000/
6. Open web browser to the above
7. Enter Address for Validation Request at TOP of page. Click Submit. (Note: Work from Top to Bottom of the page to perform tests.)
8. Copy message from "Address Validation Request Results" response area on screen and to perform a sign/verify using the Electrum Wallet.
9. Paste the wallet's signature into the box labeled "Enter Signature Validation Request". Click Submit.
10. Look for "registerStar: true" and "messageSignature: true" in the "Signature Validation Results" area of the screen. If present, the signature was valid. Otherwise an error is printed.
11. Enter Star Detials and Story. Click Submit.
12. In the "Star Details Results" area of the screen, find the "hash" value, "address" value and "heigth" value to copy and paste into the appropriate serach box located under the "Additional Functionalities" section of the screen.
13. Enter a "hash" value to retrieve 
14. Enter a "address" value to retrieve 
15. Enter a height / block number to retrieve 
