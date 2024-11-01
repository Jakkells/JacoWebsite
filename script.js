// Elements
const gameLog = document.getElementById('gameLog');
const playerInput = document.getElementById('playerInput');
let playerName = '';
let currentPlayer = null; // Add this to track current player globally
// Sell price is 50% of buy price
const SELL_PRICE_MULTIPLIER = 0.5;

// Constants for base prices per item type and quality multipliers
const basePrices = {
    sword: 10,
    helmet: 18,
    gloves: 13,
    chestplate: 25,
    greaves: 22,
    boots: 16,
    leggings: 7,
    shield: 15,
    robes: 44,
    wand: 1
};

const qualityMultipliers = {
    common: 1,
    uncommon: 5,
    rare: 20,
    epic: 100,
    legendary: 1000,
    mythic: 100000
};

// Item class for better item representation
class Item {
    constructor(quality, name, amount) {
        this.quality = quality;
        this.name = name;
        this.amount = amount;
    }

    toString() {
        return `${this.quality}:${this.name}:${this.amount}`;
    }
}

// Inventory class
class Inventory {
    constructor(playerName) {
        this.playerName = playerName;
        this.validQualities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
        this.validItemTypes = [
            'helmet', 'gloves', 'chestplate', 'greaves', 'boots', 'leggings', 
            'sword', 'shield', 'robes', 'wand'
        ];
        this.items = this.loadInventory();
    }

    // Use a unique key for each player's inventory
    loadInventory() {
        const inventoryData = localStorage.getItem(`inventory_${this.playerName}`);
        if (!inventoryData) {
            return [];
        }
        return inventoryData.split(',').map(itemStr => {
            const [quality, name, amount] = itemStr.split(':');
            return new Item(quality, name, parseInt(amount));
        });
    }

    saveInventory() {
        const inventoryStr = this.items.map(item => item.toString()).join(',');
        localStorage.setItem(`inventory_${this.playerName}`, inventoryStr);
    }

    // Add item with validation for quality and type
    addItem(item) {

        // Validate item quality
        if (!this.validQualities.includes(item.quality)) {
            logMessage(`Invalid quality: ${item.quality}. Valid qualities are: ${this.validQualities.join(', ')}`);
            return; // Stop processing if quality is invalid
        }

        // Validate item type
        if (!this.validItemTypes.includes(item.name)) {
            logMessage(`Invalid item type: ${item.name}. Valid item types are: ${this.validItemTypes.join(', ')}`);
            return; // Stop processing if item type is invalid
        }

        // Check if item already exists in inventory
        const existingItem = this.items.find(i => i.quality === item.quality && i.name === item.name);
        if (existingItem) {
            existingItem.amount += item.amount; // Increment existing item amount
        } else {
            this.items.push(item); // Add new item to inventory
        }
        
        // Save updated inventory and log message
        this.saveInventory();
        playerInput.value = ""; // Clear input
        //this.display(); // Refresh inventory display
    }

    // Display inventory in a table format
    display() {

        if (this.items.length === 0) {
            logMessage("Your inventory is empty.");
            return;
        }

        // Create and style the inventory table
        const table = document.createElement('table');
        table.style.width = '80%';
        table.style.margin = '0 auto';
        table.setAttribute('border', '1');
        table.style.borderCollapse = 'collapse';

        // Header row
        const header = table.insertRow();
        header.insertCell(0).innerHTML = "Item Type";
        header.insertCell(1).innerHTML = "Item Quality";
        header.insertCell(2).innerHTML = "Amount";

        // Data rows
        this.items.forEach(item => {
            const row = table.insertRow();
            row.insertCell(0).innerHTML = item.name;
            row.insertCell(1).innerHTML = item.quality;
            row.insertCell(2).innerHTML = item.amount;
        });

        // Append the table to the game log
        gameLog.appendChild(table);
    }

    // Method to check if the inventory has a specific item and amount
    hasItem(item, requiredAmount) {
        const existingItem = this.items.find(i => i.quality === item.quality && i.name === item.name);
        return existingItem && existingItem.amount >= requiredAmount; // Return true if item exists and has enough amount
    }

    // Method to remove a specific item and amount from the inventory
    removeItem(item, amountToRemove) {
    const existingItem = this.items.find(i => i.quality === item.quality && i.name === item.name);

    // Check if the item exists and has enough amount to remove
    if (existingItem) {
        if (existingItem.amount >= amountToRemove) {
            existingItem.amount -= amountToRemove; // Deduct the amount
            
            // If the amount drops to zero, remove the item from the inventory
            if (existingItem.amount === 0) {
                this.items = this.items.filter(i => i !== existingItem);
            }

            // Save updated inventory
            this.saveInventory();
        } else {
            logMessage(`You don't have enough ${item.quality} ${item.name} to remove. You have ${existingItem.amount}.`);
        }
        } else {
            logMessage(`You don't have any ${item.quality} ${item.name} in your inventory.`);
        }
    }

}

// Player Data class
class Player {
    constructor(name) {
        this.name = name;
        this.level = 0;
        this.gold = 10; // Starting gold
        this.inventory = new Inventory(name); // Associate inventory with player
    }

    // Add methods to handle gold transactions
    addGold(amount) {
        this.gold += amount;
        this.save();
        currentPlayer.updateDisplay();
        return this.gold;
    }

    subtractGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            this.save();
            currentPlayer.updateDisplay();
            return true;
        }
        return false;
    }

    updateDisplay() {
        const nameElement = document.getElementById('playerName');
        const levelElement = document.getElementById('playerLevel');
        const goldElement = document.getElementById('playerGold');
        
        if (nameElement) nameElement.textContent = this.name;
        if (levelElement) levelElement.textContent = this.level;
        if (goldElement) goldElement.textContent = this.gold;
    }

    save() {
        localStorage.setItem(this.name, JSON.stringify(this));
        this.inventory.saveInventory(); // Save the associated inventory
    }

    // Method to display the player's inventory
    showInventory() {
        this.inventory.display(); // Call the display method from the Inventory class
    }

    // Update the loadPlayer method to also load inventory
    static loadPlayer(name) {
        const savedData = localStorage.getItem(name);
        if (savedData) {
            const data = JSON.parse(savedData);
            const player = new Player(data.name);
            player.level = data.level;
            player.gold = data.gold;
            player.inventory = new Inventory(data.name); // Load player's inventory
            return player;
        }
        return null;
    }
}

// Initialize Inventory
const playerInventory = new Inventory();

// Function to log messages to the gameLog
function logMessage(message) {
    const newMessage = document.createElement('p');
    newMessage.textContent = message;
    gameLog.appendChild(newMessage);
    gameLog.scrollTop = gameLog.scrollHeight; // Auto-scroll to the bottom
}

// Function to display player data in a table format
function displayPlayerData(playerData) {
    const table = document.createElement('table');
    table.style.width = '80%';
    table.style.margin = '0 auto';
    table.setAttribute('border', '1');
    table.style.borderCollapse = 'collapse';

    const header = table.insertRow();
    header.insertCell(0).innerHTML = "Account Name";
    header.insertCell(1).innerHTML = "Level";
    header.insertCell(2).innerHTML = "Gold";

    const row = table.insertRow();
    row.insertCell(0).innerHTML = playerData.name;
    row.insertCell(1).innerHTML = playerData.level;
    row.insertCell(2).innerHTML = playerData.gold;

    gameLog.appendChild(table);
}

// Function to get the price of an item based on type and quality
function getPrice(item) {
    const basePrice = basePrices[item.name];
    const multiplier = qualityMultipliers[item.quality];
    return basePrice * multiplier;
}

function shop(shopCommand) {
    const commandArray = shopCommand.split(':');

    if (commandArray[1] === 'buy') {
        const quality = commandArray[3];
        const name = commandArray[2];
        const amount = parseInt(commandArray[4]);

        const item = new Item(quality, name, amount);
        const itemPrice = getPrice(item);
        const totalPrice = itemPrice * amount;

        if (!currentPlayer) {
            logMessage("Player not initialized.");
            return;
        }

        // Check if the player has enough gold to buy the item
        if (currentPlayer.subtractGold(totalPrice)) {
            // Add the item to the current player's inventory
            currentPlayer.inventory.addItem(item); // Correctly add to the player's inventory

            logMessage(`You bought ${amount} ${quality} ${name} for ${totalPrice} gold.`);
        } else {
            logMessage(`Not enough gold. ${amount} ${quality} ${name} costs ${totalPrice} gold.`);
        }
    }
    else if (commandArray[1] === 'sell') {
        const quality = commandArray[3];
        const name = commandArray[2];
        const amount = parseInt(commandArray[4]);
    
        const item = new Item(quality, name, amount);
        
        // Check if the player has enough of the item to sell
        if (!currentPlayer.inventory.hasItem(item, amount)) { // Pass amount to hasItem
            logMessage(`You don't have ${amount} ${quality} ${name} to sell.`);
            return;
        }
    
        const itemPrice = getPrice(item);
        const sellPrice = Math.floor(itemPrice * SELL_PRICE_MULTIPLIER);
        const totalSellPrice = sellPrice * amount;
    
        // Remove the specified amount of the item from the inventory
        currentPlayer.inventory.removeItem(item, amount); // Pass amount to removeItem
    
        // Add the sell price to the player's gold
        currentPlayer.addGold(totalSellPrice);
    
        logMessage(`You sold ${amount} ${quality} ${name} for ${totalSellPrice} gold.`);
    }
}

// Function to process user commands
function processCommand(command) {
    const parts = command.split(':');
    const firstWord = parts[0].trim();

    switch (firstWord.toLowerCase()) {
        case 'shop':
            shop(command);
            break;
        case 'inventory':
            currentPlayer.showInventory();
            break;
        case 'profile':
            displayPlayerData(playerData);
            break;
        // Other commands like equip, remove, battle, etc.
    }

    
}

function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function navigateToCommands() {
    window.location.href = 'commands.html';
}

function navigateToHome() {
    window.location.href = 'index.html';
}


// Initial message
logMessage("Hello player! Please enter your account name.");

let isNameEntered = false; // Flag to check if the player name has been entered

// Event listener for Enter key submission
playerInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const inputText = playerInput.value.trim();

        if (!isNameEntered) {
            if (inputText) {
                playerName = inputText;
                // Try to load existing player or create new one
                currentPlayer = Player.loadPlayer(inputText);
                
                if (currentPlayer) {
                    // Player is returning
                    logMessage(`Welcome back, ${currentPlayer.name}. These are your account stats:`);

                    console.log("returning Player");

                } else {
                    // New player
                    currentPlayer = new Player(inputText);
                    currentPlayer.save();
                    logMessage(`Welcome, ${inputText}. These are your account stats:`);

                    console.log("new player");
                }

                currentPlayer.updateDisplay();
                displayPlayerData(currentPlayer);
                playerInput.value = "";
                logMessage('Where will your adventure begin?');
                isNameEntered = true;
            } else {
                logMessage('Please enter a valid name.');
            }
        } else {
            processCommand(inputText);
            playerInput.value = "";
        }
    }
});

