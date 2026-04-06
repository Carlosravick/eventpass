import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "./config/contracts";
import { TOKEN_ABI } from "./abi/tokenAbi";
import { STAKING_ABI } from "./abi/stakingAbi";
import { NFT_ABI } from "./abi/nftAbi";
import { DAO_ABI } from "./abi/daoAbi";
import { ORACLE_ABI } from "./abi/oracleAbi";
import "./App.css";

function App() {
  const [wallet, setWallet] = useState("");
  const [balance, setBalance] = useState("0");
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakedAmount, setStakedAmount] = useState("0");
  const [stakeTimestamp, setStakeTimestamp] = useState("-");
  const [oraclePrice, setOraclePrice] = useState("-");
  const [tokenUri, setTokenUri] = useState("https://example.com/event-pass.json");
  const [proposalDescription, setProposalDescription] = useState("Aumentar benefícios do evento");
  const [proposalDuration, setProposalDuration] = useState("10");
  const [proposalId, setProposalId] = useState("1");
  const [status, setStatus] = useState("Aguardando conexão com a carteira...");
  const [loading, setLoading] = useState(false);

  const [nftId, setNftId] = useState("0");
  const [nftOwner, setNftOwner] = useState("-");
  const [nftTokenUri, setNftTokenUri] = useState("-");
  const [nftExists, setNftExists] = useState(false);

  async function loadWalletData(address, signer) {
    const token = new ethers.Contract(CONTRACTS.token, TOKEN_ABI, signer);
    const staking = new ethers.Contract(CONTRACTS.staking, STAKING_ABI, signer);
    const oracle = new ethers.Contract(CONTRACTS.oracle, ORACLE_ABI, signer);

    const bal = await token.balanceOf(address);
    const stakeInfo = await staking.stakes(address);
    const price = await oracle.getLatestPrice();

    setBalance(ethers.formatEther(bal));
    setStakedAmount(ethers.formatEther(stakeInfo.amount));
    setOraclePrice((Number(price) / 1e8).toFixed(2));

    if (Number(stakeInfo.timestamp) > 0) {
      const date = new Date(Number(stakeInfo.timestamp) * 1000);
      setStakeTimestamp(date.toLocaleString("pt-BR"));
    } else {
      setStakeTimestamp("-");
    }
  }

  async function loadNftData(tokenId, signer) {
    try {
      const nft = new ethers.Contract(CONTRACTS.nft, NFT_ABI, signer);

      const owner = await nft.ownerOf(tokenId);
      const uri = await nft.tokenURI(tokenId);

      setNftOwner(owner);
      setNftTokenUri(uri);
      setNftExists(true);
    } catch (error) {
      setNftOwner("-");
      setNftTokenUri("-");
      setNftExists(false);
    }
  }

  async function getSignerAndAddress() {
    if (!window.ethereum) {
      throw new Error("MetaMask não encontrada.");
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    return { signer, address };
  }

  async function connectWallet() {
    try {
      setLoading(true);
      const { signer, address } = await getSignerAndAddress();

      setWallet(address);
      await loadWalletData(address, signer);
      await loadNftData(0, signer);

      setStatus("Carteira conectada com sucesso.");
    } catch (error) {
      console.error(error);
      setStatus("Erro ao conectar carteira.");
    } finally {
      setLoading(false);
    }
  }

  async function approveTokens() {
    try {
      if (!stakeAmount) {
        setStatus("Informe a quantidade para approve.");
        return;
      }

      setLoading(true);

      const { signer, address } = await getSignerAndAddress();
      const token = new ethers.Contract(CONTRACTS.token, TOKEN_ABI, signer);
      const amount = ethers.parseEther(stakeAmount);

      const tx = await token.approve(CONTRACTS.staking, amount);
      setStatus("Aguardando confirmação do approve...");
      await tx.wait();

      await loadWalletData(address, signer);
      setStatus("Approve realizado com sucesso.");
      setStakeAmount("");
    } catch (error) {
      console.error(error);
      setStatus("Erro no approve.");
    } finally {
      setLoading(false);
    }
  }

  async function stakeTokens() {
    try {
      if (!stakeAmount) {
        setStatus("Informe a quantidade para stake.");
        return;
      }

      setLoading(true);

      const { signer, address } = await getSignerAndAddress();
      const staking = new ethers.Contract(CONTRACTS.staking, STAKING_ABI, signer);
      const amount = ethers.parseEther(stakeAmount);

      const tx = await staking.stake(amount);
      setStatus("Aguardando confirmação do stake...");
      await tx.wait();

      await loadWalletData(address, signer);
      setStatus("Stake realizado com sucesso.");
      setStakeAmount("");
    } catch (error) {
      console.error(error);
      setStatus("Erro no stake.");
    } finally {
      setLoading(false);
    }
  }

  async function mintNft() {
    try {
      setLoading(true);

      const { signer, address } = await getSignerAndAddress();
      const nft = new ethers.Contract(CONTRACTS.nft, NFT_ABI, signer);

      const tx = await nft.mintPass(address, tokenUri);
      setStatus("Aguardando confirmação do mint NFT...");
      await tx.wait();

      await loadNftData(0, signer);

      setStatus("NFT mintado com sucesso.");
    } catch (error) {
      console.error(error);
      setStatus("Erro ao mintar NFT.");
    } finally {
      setLoading(false);
    }
  }

  async function createProposal() {
    try {
      if (!proposalDescription || !proposalDuration) {
        setStatus("Preencha descrição e duração da proposta.");
        return;
      }

      setLoading(true);

      const { signer } = await getSignerAndAddress();
      const dao = new ethers.Contract(CONTRACTS.dao, DAO_ABI, signer);

      const tx = await dao.createProposal(proposalDescription, Number(proposalDuration));
      setStatus("Aguardando confirmação da proposta...");
      await tx.wait();

      setStatus("Proposta criada com sucesso.");
    } catch (error) {
      console.error(error);
      setStatus("Erro ao criar proposta.");
    } finally {
      setLoading(false);
    }
  }

  async function voteProposal(support) {
    try {
      if (!proposalId) {
        setStatus("Informe o ID da proposta.");
        return;
      }

      setLoading(true);

      const { signer } = await getSignerAndAddress();
      const dao = new ethers.Contract(CONTRACTS.dao, DAO_ABI, signer);

      const tx = await dao.vote(Number(proposalId), support);
      setStatus("Aguardando confirmação do voto...");
      await tx.wait();

      setStatus(`Voto ${support ? "SIM" : "NÃO"} realizado com sucesso.`);
    } catch (error) {
      console.error(error);
      setStatus("Erro ao votar.");
    } finally {
      setLoading(false);
    }
  }

  async function checkNftById() {
    try {
      setLoading(true);
      const { signer } = await getSignerAndAddress();
      await loadNftData(Number(nftId), signer);
      setStatus("Consulta do NFT realizada com sucesso.");
    } catch (error) {
      console.error(error);
      setStatus("Erro ao consultar NFT.");
    } finally {
      setLoading(false);
    }
  }

  const shortWallet = wallet
    ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
    : "Não conectada";

  const shortNftOwner =
    nftOwner && nftOwner !== "-"
      ? `${nftOwner.slice(0, 6)}...${nftOwner.slice(-4)}`
      : "-";

  const formattedOraclePrice =
    oraclePrice !== "-" ? `$ ${Number(oraclePrice).toLocaleString("pt-BR")}` : "-";

  return (
    <div className="app">
      <div className="background-glow glow-1"></div>
      <div className="background-glow glow-2"></div>

      <div className="container" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="hero-card">
          <p className="badge">Web3 Event Platform</p>
          <h1>EventPass Web3</h1>
          <p className="subtitle">
            Plataforma descentralizada para eventos com token, staking e governança.
          </p>

          <button
            className="primary-btn"
            onClick={connectWallet}
            disabled={!!wallet || loading}
          >
            {wallet ? "Carteira conectada" : loading ? "Conectando..." : "Conectar MetaMask"}
          </button>

          <div className="wallet-box">
            <div className="info-row">
              <span className="label">Carteira</span>
              <span className="value">{shortWallet}</span>
            </div>
            <div className="info-row">
              <span className="label">Saldo EVT</span>
              <span className="value">{Number(balance).toLocaleString("pt-BR")} EVT</span>
            </div>
            <div className="info-row">
              <span className="label">Em staking</span>
              <span className="value">{Number(stakedAmount).toLocaleString("pt-BR")} EVT</span>
            </div>
            <div className="info-row">
              <span className="label">Último stake</span>
              <span className="value">{stakeTimestamp}</span>
            </div>
            <div className="info-row">
              <span className="label">Preço ETH (Chainlink)</span>
              <span className="value">{formattedOraclePrice}</span>
            </div>
          </div>
        </div>

        <div className="staking-card">
          <h2>Staking</h2>
          <p className="section-text">
            Aprove seus tokens EVT e faça stake diretamente pela interface.
          </p>

          <input
            className="input"
            placeholder="Digite a quantidade"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
          />

          <div className="button-group">
            <button
              className="secondary-btn"
              onClick={approveTokens}
              disabled={!wallet || loading}
            >
              {loading ? "Processando..." : "Approve"}
            </button>

            <button
              className="primary-btn"
              onClick={stakeTokens}
              disabled={!wallet || loading}
            >
              {loading ? "Processando..." : "Stake"}
            </button>
          </div>

          <div className="status-box">
            <span className="label">Status</span>
            <p>{status}</p>
          </div>
        </div>

        <div className="staking-card">
          <h2>NFT do Evento</h2>
          <p className="section-text">
            Mint do ingresso digital do evento via EventPassNFT.
          </p>

          <input
            className="input"
            placeholder="Token URI"
            value={tokenUri}
            onChange={(e) => setTokenUri(e.target.value)}
            style={{ marginBottom: "12px" }}
          />

          <div className="button-group" style={{ marginBottom: "20px" }}>
            <button
              className="primary-btn"
              onClick={mintNft}
              disabled={!wallet || loading}
            >
              {loading ? "Processando..." : "Mint NFT"}
            </button>
          </div>

          <input
            className="input"
            placeholder="ID do NFT"
            value={nftId}
            onChange={(e) => setNftId(e.target.value)}
            style={{ marginBottom: "12px" }}
          />

          <div className="button-group" style={{ marginBottom: "20px" }}>
            <button
              className="secondary-btn"
              onClick={checkNftById}
              disabled={!wallet || loading}
            >
              {loading ? "Processando..." : "Ver ingresso"}
            </button>
          </div>

          <div className="wallet-box">
            <div className="info-row">
              <span className="label">NFT existe</span>
              <span className="value">{nftExists ? "Sim" : "Não"}</span>
            </div>
            <div className="info-row">
              <span className="label">NFT ID</span>
              <span className="value">{nftId}</span>
            </div>
            <div className="info-row">
              <span className="label">Dono</span>
              <span className="value">{shortNftOwner}</span>
            </div>
            <div className="info-row">
              <span className="label">Token URI</span>
              <span className="value" style={{ wordBreak: "break-all", textAlign: "right" }}>
                {nftTokenUri}
              </span>
            </div>
          </div>
        </div>

        <div className="staking-card">
          <h2>Governança DAO</h2>
          <p className="section-text">
            Crie propostas e vote usando seus tokens EVT.
          </p>

          <input
            className="input"
            placeholder="Descrição da proposta"
            value={proposalDescription}
            onChange={(e) => setProposalDescription(e.target.value)}
            style={{ marginBottom: "12px" }}
          />

          <input
            className="input"
            placeholder="Duração em minutos"
            value={proposalDuration}
            onChange={(e) => setProposalDuration(e.target.value)}
            style={{ marginBottom: "12px" }}
          />

          <div className="button-group" style={{ marginBottom: "20px" }}>
            <button
              className="primary-btn"
              onClick={createProposal}
              disabled={!wallet || loading}
            >
              {loading ? "Processando..." : "Criar proposta"}
            </button>
          </div>

          <input
            className="input"
            placeholder="ID da proposta"
            value={proposalId}
            onChange={(e) => setProposalId(e.target.value)}
          />

          <div className="button-group">
            <button
              className="secondary-btn"
              onClick={() => voteProposal(true)}
              disabled={!wallet || loading}
            >
              {loading ? "Processando..." : "Votar SIM"}
            </button>

            <button
              className="primary-btn"
              onClick={() => voteProposal(false)}
              disabled={!wallet || loading}
            >
              {loading ? "Processando..." : "Votar NÃO"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;