import React, {useEffect, useState} from 'react';
import {ethers} from "ethers";
import {contractABI, contractAddress} from '../utils/constants';

export const TransactionContext = React.createContext();

const {ethereum} = window;

//获取合约对象
const getEthereumContract = async () => {
    //获取provider
    const provider = new ethers.BrowserProvider(ethereum);
    //获取signer
    const signer = await provider.getSigner();
    //获取合约对象
    const transactionContract = new ethers.Contract(contractAddress, contractABI, signer);
    // console.log({
    //     provider,
    //     signer,
    //     transactionContract
    // })
    return transactionContract;
}

export const TransactionProvider = ({children}) => {
    const provider = new ethers.BrowserProvider(ethereum);
    //当前账号
    const [currentAccount, setCurrentAccount] = useState('');
    const [transactions, setTransactions] = useState([]);
    //当前账户余额
    const [balance, setBalance] = useState('');
    //input内容
    const [formData, setFormData] = useState({
        addressTo: '',
        amount: '',
        keyword: '',
        message: '',
    })
    //是否正在发送
    const [isLoading, setIsLoading] = useState(false);
    //交易数量,存储到浏览器
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'))
    //表单内容变化
    const handleChange = (e, name) => {
        setFormData((prevState) => ({
            ...prevState,
            [name]: e.target.value
        }))
    }
    const getAllTransactions = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");
            const transactionContract = await getEthereumContract();
            const availableTransactions = await transactionContract.getAllTransactions();
            const structuredTransactions = availableTransactions.map((transaction) => ({
                addressTo: transaction.receiver,
                addressFrom: transaction.sender,
                timestamp: new Date(parseInt(transaction.timestamp) * 1000).toLocaleString(),
                message: transaction.message,
                keyword: transaction.keyword,
                amount: parseInt(transaction.amount) / (10 ** 18)
            }));
            console.log(structuredTransactions);
            setTransactions(structuredTransactions);
        } catch (error) {
            console.log(error);
        }
    }
    //检查是否安装了matemask，如果没有就提示安装。
    const checkIfWalletIsConnected = async () => {
        try {
            //检查是否安装了matemask，如果没有就提示安装。
            if (!ethereum) return alert("Please install MetaMask.");
            //获取当前账号
            const accounts = await ethereum.request({method: "eth_accounts"});
            if (accounts.length) {
                //有账号，将账号设置为当前账号
                setCurrentAccount(accounts[0]);
                getAllTransactions();
                //当前账户余额
                const balance = await provider.getBalance(accounts[0]);
                setBalance((+ethers.formatEther(balance)).toFixed(4));
            } else {
                console.log("No accounts found.");
            }
        } catch (error) {
            console.log(error);
            throw new Error("No ethereum object.");
        }

    }
    //检查交易数量
    const checkIfTransactionsExists = async () => {
        try {
            const transactionContract = await getEthereumContract();
            const transactionCount = await transactionContract.getTransactionCount();
            window.localStorage.setItem("transactionCount", transactionCount);
        } catch (error) {
            console.log(error);
            throw new Error("No ethereum object.");
        }
    }
    //链接钱包方法
    const connectWallet = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");
            //链接钱包账户
            const accounts = await ethereum.request({method: "eth_requestAccounts"});
            setCurrentAccount(accounts[0]);
            //当前账户余额
            const balance = await provider.getBalance(accounts[0]);
            //截取小数点后四位
            setBalance((+ethers.formatEther(balance)).toFixed(4));
        } catch (error) {
            console.log(error);
            throw new Error("No ethereum object.");
        }
    }
    //发送交易
    const sendTransaction = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");
            //input内容
            const {addressTo, amount, keyword, message} = formData;
            //获取合约对象
            const transactionContract = await getEthereumContract()
            //转换为wei
            const parsedAmount = ethers.parseEther(amount);
            //发送交易（matemask）
            await ethereum.request({
                method: "eth_sendTransaction",
                params: [{
                    from: currentAccount,
                    to: addressTo,
                    gas: "0x5208", //21000 Gwei
                    value: parsedAmount.toString(16),
                }]
            })
            //发送交易（合约存储相关交易内容）
            const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword);
            //等待交易完成
            setIsLoading(true);
            console.log(`Loading - ${transactionHash.hash}`);
            await transactionHash.wait();
            //交易完成
            setIsLoading(false);
            console.log(`Success - ${transactionHash.hash}`);
            //获取交易数量
            const transactionCount = await transactionContract.getTransactionCount();

            setTransactionCount(transactionCount);
            window.location.reload();

        } catch (error) {
            console.log(error);
            throw new Error("No ethereum object.");
        }
    }
    //初始化
    useEffect(() => {
        checkIfWalletIsConnected()
        checkIfTransactionsExists()
    }, [])
    return (
        //返回上下文
        <TransactionContext.Provider
            value={{connectWallet,transactions, currentAccount, formData, handleChange, sendTransaction, balance,isLoading}}>
            {children}
        </TransactionContext.Provider>
    )
}
