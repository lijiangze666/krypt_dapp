const { ethers} = require("hardhat");
const main = async () => {
    const transactionsFactory = await ethers.getContractFactory("Transactions");
    const transactionsContract = await transactionsFactory.deploy();


    await transactionsContract.waitForDeployment();

    console.log("Transactions address: ", await transactionsContract.getAddress());
};

const runMain = async () => {
    try {
        await main();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

runMain();
