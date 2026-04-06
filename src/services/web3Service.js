import { ethers } from "ethers";

export async function getProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask não encontrada.");
  }

  return new ethers.BrowserProvider(window.ethereum);
}

export async function getSigner() {
  const provider = await getProvider();
  await window.ethereum.request({ method: "eth_requestAccounts" });
  return provider.getSigner();
}