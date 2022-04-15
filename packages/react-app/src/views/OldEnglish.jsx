import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, List, Spin, Popover, Form, Switch, Input, Radio, Space, Select, Cascader, DatePicker, InputNumber, TreeSelect } from "antd";
import { BorderBottomOutlined, PicCenterOutlined, RedoOutlined } from "@ant-design/icons";
import { Address, AddressInput } from "../components";
import { useDebounce } from "../hooks";
import { ethers, BigNumber } from "ethers";
import { useEventListener } from "eth-hooks/events/useEventListener";

//==========my custom import
import mainnetZoraAddresses from "@zoralabs/v3/dist/addresses/4.json"; // Rinkeby addresses, 1.json would be Rinkeby Testnet 
import "./Marketplace.css";
import LF_Logo_V1 from "./LF_Logo_V1.png";
//==========my custom import

function OldEnglish({
  readContracts,
  mainnetProvider,
  blockExplorer,
  totalSupply,
  DEBUG,
  writeContracts,
  tx,
  address,
  localProvider,
  oldEnglishContract,
  balance,
  startBlock,
  ///=======my custom imports
  zoraTransferHelperContract,
  zmmContract,
  zoraAsksContract,
  lostandfoundNFTContract,
  erc721TransferHelperApproved,
  zoraModuleManagerApproved,
  maxSupply
  ///=======my custom imports
}) {
  const [allOldEnglish, setAllOldEnglish] = useState({});
  const [loadingOldEnglish, setLoadingOldEnglish] = useState(true);
  const perPage = 12;
  const [page, setPage] = useState(0);

  //===CUSTOM STATE SETTING TO HANDLE FINDERS FEE INPUT LOGIC
  const [createFinderIsDisabled, setCreateFinderIsDisabled] = useState(true);
  
  const createHandleClickFalse = () => {
    setCreateFinderIsDisabled(false)
  };

  const createHandleClickTrue = () => {
    setCreateFinderIsDisabled(true)
  };

  const [fillFinderIsDisabled, setFillFinderIsDisabled] = useState(true);
  
  const fillHandleClickFalse = () => {
    setFillFinderIsDisabled(false)
  };

  const fillHandleClickTrue = () => {
    setFillFinderIsDisabled(true)
  };

  //====marketplace action in-flight states (doesnt work because shows up on every card simultaenously)
/*   const [listing, setListing] = useState(false);
  const [set, setSet] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [fill, setFill] = useState(false);
  const [transferHelper, setTransferHelper] = useState(false);
  const [moduleManager, setModuleManager] = useState(false); */


  //====my custom addition
  const nftContractAddress = "0x313162D682F57b68E4974b88974D0cAE792E27eF"; //<-- LF | OE -> "0x03D6563e2047534993069F242181B207f80C5dD9";
  // Imports + declartions for ZORA Approval Contracts
  //const erc721TransferHelperAddress = mainnetZoraAddresses.ERC721TransferHelper;
  //const moduleManagerAddress = mainnetZoraAddresses.ZoraModuleManager;
  //const asksModuleV1_1Address = mainnetZoraAddresses.AsksV1_1;
  //const oldEnglishContractAddress = "0x03D6563e2047534993069F242181B207f80C5dD9";
  //const lostandfoundContractAddress = "0x0E0e37De35471924F50598d55F7b69f93703fA01";
  
  const fetchMetadataAndUpdate = async id => {
    try {
      const tokenURI = await readContracts[lostandfoundNFTContract].tokenURI(id);
      const nftMetadataURL = "https://ipfs.io/ipfs/" + tokenURI.substring(7); 
      const nftMetadataFetch = await fetch(nftMetadataURL); 

      //===CUSTOM UPDATE
      const seller = await readContracts[zoraAsksContract].askForNFT(nftContractAddress, id);
      const ownerAddress = await readContracts[lostandfoundNFTContract].ownerOf(id);
      const ownerAddressCleaned = ownerAddress.toString().toLowerCase();
      //===CUSTOM UPDATE

      try {
        const nftMetadataObject = await nftMetadataFetch.json();
        const collectibleUpdate = {};

        //===CUSTOM UPDATE, added askSeller: seller and nftOwner: ownerAddress as key:value pairs
        collectibleUpdate[id] = { id: id, uri: tokenURI, askSeller: seller, nftOwner: ownerAddressCleaned, ...nftMetadataObject};
        //====CUSTOM UPDATE

        setAllOldEnglish(i => ({ ...i, ...collectibleUpdate }));
      } catch (e) {
        console.log(e);
      }
    } catch (e) {
      console.log(e);
    }
  };


  const updateAllOldEnglish = async () => {
    if (readContracts[lostandfoundNFTContract] && totalSupply) {
      setLoadingOldEnglish(true);
      let numberSupply = totalSupply.toNumber();

      let tokenList = Array(numberSupply).fill(0);

      tokenList.forEach((_, i) => {
        let tokenId = i; //make this i + 1 if you're first token ID is 1 instead of 0
        if (tokenId <= numberSupply - page * perPage && tokenId >= numberSupply - page * perPage - perPage) {
          fetchMetadataAndUpdate(tokenId);
        } else if (!allOldEnglish[tokenId]) {
          const simpleUpdate = {};
          simpleUpdate[tokenId] = { id: tokenId };
          setAllOldEnglish(i => ({ ...i, ...simpleUpdate }));
        }
      });

      setLoadingOldEnglish(false);
    }
  };

  const updateYourOldEnglish = async () => {
    for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
      try {
        const tokenId = await readContracts[oldEnglishContract].tokenOfOwnerByIndex(address, tokenIndex);
        fetchMetadataAndUpdate(tokenId);
      } catch (e) {
        console.log(e);
      }
    }
  };

  const updateOneOldEnglish = async id => {
    if (readContracts[lostandfoundNFTContract] && totalSupply) {
      fetchMetadataAndUpdate(id);
    }
  };

  useEffect(() => {
    if (totalSupply && totalSupply.toNumber() > 0) updateAllOldEnglish();
  }, [readContracts[lostandfoundNFTContract], (totalSupply || "0").toString(), page]);

  const onFinishFailed = errorInfo => {
    console.log("Failed:", errorInfo);
  };

  let filteredOEs = Object.values(allOldEnglish).sort((a, b) => b.askSeller.askPrice - a.askSeller.askPrice);
  const [mine, setMine] = useState(false);
  if (mine == true && address && filteredOEs) {
    filteredOEs = filteredOEs.filter(function (el) {
      return el.nftOwner == address.toLowerCase();
    });
  }

  //========MY CUSTOM FUNCTIONALITY=======

  //********* CREATE ASK FLOW ***********
  const [createAskForm] = Form.useForm();
  const createAsk = id => {
    const [listing, setListing] = useState(false);

    return (
      <div style={{ display: "flex", flexDirection: "row", jusitfyContent: "center" }}>
        <Form
          style={{ display: "flex", flexDirection: "row", jusitfyContent: "center" }}
          className="createAskFormPopover"
          form={createAskForm}
          layout={"inline"}
          name="create ask"
          initialValues={{ 
            tokenId: id,
            askPrice: '',
            sellerFundsRecipient: '',
            findersFeeBps: '',
          }}
          onFinish={async values => {
            setListing(true);
            try {
              const txCur = await tx(writeContracts[zoraAsksContract].createAsk(
                nftContractAddress,
                id,
                ethers.utils.parseUnits(values["askPrice"], 'ether'), 
                "0x0000000000000000000000000000000000000000",
                values["sellerFundsRecipient"],
                values["findersFeeBps"] * 100
              ));
              await txCur.wait();
              updateOneOldEnglish(id);
              setListing(false);
            } catch (e) {
              console.log("create ask failed", e);
              setListing(false);
            }
          }}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item            
            name="askPrice"
            rules={[
              {
                required: true,
                message: "How much are you listing this NFT for??",
              },
            ]}
          >
            <Input
            placeholder={"Listing Price (ETH): "}
            addonAfter={"ETH"}
            />
          </Form.Item>         
          <Form.Item
            name="sellerFundsRecipient"
            rules={[
              {
                required: true,
                message: "Who's gets the funds from this sale?",
              },
            ]}
          >
            <Input
            placeholder={"Seller Funds Recipient (Full Wallet Address):"}
            />
          </Form.Item>
          <Form.Item
            name="findersFeeBps"
            rules={[
              {
                required: true,
                message: "How much is the finder's fee?",
              },
            ]}
          >
            <div>
              <Radio.Group>
                <Radio onClick={createHandleClickFalse} value={""}>Add Finder's Fee</Radio>                
                <Radio onClick={createHandleClickTrue} value={"0x0000000000000000000000000000000000000000"}>No Finder's Fee</Radio>
              </Radio.Group>
              <Input
              placeholder={"Finders Fee BPS in %"}
              addonAfter={"%"}
              disabled={createFinderIsDisabled}
              />
            </div>
          </Form.Item>          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={listing}>
              List
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  };  

  //********* Set Ask Price FLOW ***********
  const [setAskForm] = Form.useForm();
  const updateAskPrice = id => {
    const [set, setSet] = useState(false);

    return (
      <div>
        <Form
          form={setAskForm}
          layout={"inline"}
          name="update ask price"
          initialValues={{ 
            tokenId: id,
            updatedPrice: '',
          }}
          onFinish={async values => {
            setSet(true);
            try {
              const txCur = await tx(writeContracts[zoraAsksContract].setAskPrice(
                nftContractAddress,
                id,
                ethers.utils.parseUnits(values["updatedPrice"], 'ether'), 
                "0x0000000000000000000000000000000000000000"
              ));
              await txCur.wait();
              updateOneOldEnglish(id);
              setSet(false);
            } catch (e) {
              console.log("update ask price failed", e);
              setSet(false);
            }
          }}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item
            name="updatedPrice"
            rules={[
              {
                required: true,
                message: "What is the new updated price (ETH)?",
              },
            ]}
          >
            <Input
            placeholder={"Updated Listing Price (ETH): "}
            addonAfter={"ETH"}
            />
          </Form.Item>                
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={set}>
              Update Listing
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  };  

  //********* Cancel Ask FLOW ***********
  const [cancelAskForm] = Form.useForm();
  const cancelAsk = id => {
    const [cancel, setCancel] = useState(false);

    return (
      <div>
        <Form
          form={cancelAskForm}
          layout={"inline"}
          name="cancel ask "
          initialValues={{ 
            tokenId: id,
          }}
          onFinish={async values => {
            setCancel(true);
            try {
              const txCur = await tx(writeContracts[zoraAsksContract].cancelAsk(
                nftContractAddress,
                id
              ));
              await txCur.wait();
              updateOneOldEnglish(id);
              setCancel(false);
            } catch (e) {
              console.log("cancel ask failed", e);
              setCancel(false);
            }
          }}
          onFinishFailed={onFinishFailed}
        >              
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={cancel}>
              Cancel Listing
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  };  

  //********* Fill Ask FLOW ***********
  const [fillAskForm] = Form.useForm();
  const fillAsk = id => {
    const [fill, setFill] = useState(false);

    return (
      <div>
        <Form
          form={fillAskForm}
          layout={"inline"}
          name="fill ask "
          initialValues={{ 
            tokenId: id,
            //fillPrice: '',
            finderAddress: '',
            //value: (fillPrice * (10**18)).toString()
          }}
          onFinish={async values => {
            setFill(true);
            try {
              const txCur = await tx(writeContracts[zoraAsksContract].fillAsk(
                nftContractAddress,
                id,
                "0x0000000000000000000000000000000000000000", // 0 address for ETH sale               
                BigNumber.from(allOldEnglish[id].askSeller.askPrice).toString(),
                values['finderAddress'],
                { value: BigNumber.from(allOldEnglish[id].askSeller.askPrice).toString() }
              ));
              await txCur.wait();
              updateOneOldEnglish(id);
              setFill(false);
            } catch (e) {
              console.log("fill ask failed", e);
              setFill(false);
            }
          }}
          onFinishFailed={onFinishFailed}
        >                
          <Form.Item
            name="finderAddress"
            rules={[
              {
                required: true,
                message: "Who helped facilitate this sale",
              },
            ]}
          >
            <div className="fillAskPopver">
              <Radio.Group >
                <Radio onClick={fillHandleClickFalse} value={""}>Reward the Finder</Radio>                
                <Radio onClick={fillHandleClickTrue} value={"0x0000000000000000000000000000000000000000"}>No Finder Involved</Radio>
              </Radio.Group>
              <Input
                placeholder={"Finder Wallet Address"}
                disabled={fillFinderIsDisabled}
              />
            </div>
          </Form.Item>        
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={fill}>
              Buy
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  };

  //===marketpalce approval <a href="https://zine.zora.co/zora-v3"></a>

  const marketplaceManager = () => {
    const [transferHelper, setTransferHelper] = useState(false);
    const [moduleManager, setModuleManager] = useState(false);

    return (
      <div className="approvalPopOverManager">
        <div className="pleaseApprovePopover">
        Lost & Found Marketplace is built on the ZORA Protocol. Please sign the following approvals to allow the protocol to interact with your assets : {/* ↓ ↓ */}
        </div>

        {/* commenting out refresh button 
        <Button
          onClick={() => {
            return updateAllOldEnglish();
          }}              
        >
          Refresh              
        </Button>
        */}

        {erc721TransferHelperApproved == true ? (
          <div
            className="erc721ApprovedPopover"
            style={{  }}>
            NFT TRANSFER HELPER IS APPROVED ✅
          </div>
          ) : (
          <Button
          className="erc721ApprovalButtonPopover"   
          style= {{ backgroundColor: "#d87456", color: "#791600", border: "4px solid #791600", fontSize: "1rem", height: "auto", borderRadius: 20  }}
            type="primary"
            loading={transferHelper}
            onClick={async () => {
              console.log("Clicked ERC721Transfer Button");
              //console.log(readContracts[oldEnglishContract].name)
              setTransferHelper(true);
              try {
                const txCur = await tx(writeContracts[lostandfoundNFTContract].setApprovalForAll(
                  "0x029AA5a949C9C90916729D50537062cb73b5Ac92", //change to 'zoraTransferHelperContract'
                  true
                ));
                await txCur.wait();
                updateOneOldEnglish();
                setTransferHelper(false);
              } catch (e) {
                console.log("ERC721Transfer HelperApproval Failed", e);
                setTransferHelper(false);
              }
            }}
          >            
            APPROVE NFT TRANSFER HELPER
          </Button>
          )}
          {zoraModuleManagerApproved == true ? (
          <div className="zmmApprovedPopover">
            MARKETPLACE PROTOCOL IS APPROVED ✅ 
          </div>              
          ) : (
          <Button
            className="zmmApprovalButtonPopover"
            style={{ backgroundColor: "#4998ff", color: "#283cc4", border: "4px solid #283cc4", fontSize: "1rem", height: "auto", borderRadius: 20, verticalAlign: "center" }}
            type="primary"
            loading={moduleManager}
            onClick={async () => {
              console.log("Clicked ZMM Button");
              setModuleManager(true);
              try {
                const txCur = await tx(writeContracts[zmmContract].setApprovalForModule(
                  "0xA98D3729265C88c5b3f861a0c501622750fF4806", /// change to 'zoraAsksContract' 
                  true
                ));
                await txCur.wait();
                updateOneOldEnglish();
                setModuleManager(false);
              } catch (e) {
                console.log("ZORA Module Manager Approval Failed", e);
                setModuleManager(false);
              }
            }}
          >      
            APPROVE MARKETPLACE PROTOCOL
          </Button>
          )}
      </div>
    )
  }

  return (
    <div className="OldEnglish">
      <div className="beforeTokenRender"> 
        <div style={{ marginBottom: 15}} >
            <img width="50%" src={LF_Logo_V1}></img>
        </div>
        <div className="ownershipFilterWrapper">
          <div className="ownershipFilterOptions">
            FULL COLLECTION
          </div>
          <Switch
          className="ownershipFilterSwitch"
            disabled={loadingOldEnglish}
            style={{ height: "50%", width: "5%", border: "4px #3e190f solid" }}
            value={mine}
            onChange={() => {
              setMine(!mine);
              updateYourOldEnglish();
            }}
          >
          </Switch>
          <div className="ownershipFilterOptions">
            MY COLLECTION 
          </div>
        </div>
      </div>
      {false ? (
        <Spin style={{ backgroundColor: "black", marginTop: "10%" }} />
      ) : (
        <div className="tokenRenderWrapper">
          <List            
            className="tokenRender"
            grid={{
              gutter: 30,
              xs: 1,
              sm: 2,
              md: 2,
              lg: 3,
              xl: 3,
              xxl: 3,
            }}
            align="center" ///THIS IS WHAT ALIGNS ALL OF THE CARDS!!!!!!
            locale={{ emptyText: `Fetching Markteplace Items...` }}
            
            
            /* commenting out pagination */
            
/*             pagination={{
              total: mine ? filteredOEs.length : totalSupply,
              defaultPageSize: perPage,
              defaultCurrent: page,
              onChange: currentPage => {
                setPage(currentPage - 1);
                console.log(currentPage);
              },
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${mine ? filteredOEs.length : maxSupply} items`,
            }}  */
            
            
            

            loading={loadingOldEnglish}
            dataSource={filteredOEs ? filteredOEs : []}
            renderItem={item => {
              const id = item.id;
              const imageWithGateway = "https://ipfs.io/ipfs/" + item.image.substring(7);

              //console.log(item.owner);
              //const nftOwner = await readContracts[lostandfoundNFTContract].ownerOf(id);
              //console.log(nftOwner);       
              return (
                <List.Item className="listItems" key={id}>
                  <Card
                    className="cards"                
                    style={{ border: "4px solid black", borderRadius: 2 }}
                    title={
                      <div className="cardHeaders" >{item.name ? item.name + "   -   " + `LF #${id}` : `LF #${id}`}

                        
{/*     commenting out individual token refresh button                    
                        <Button
                          shape="circle"
                          onClick={() => {
                            updateOneOldEnglish(id);
                          }}
                          icon={<RedoOutlined />}
                        />
 */}

                      </div>

                    }
                  >
                    <a                      
                      href={`${blockExplorer}token/${
                        readContracts[lostandfoundNFTContract] && readContracts[lostandfoundNFTContract].address
                      }?a=${id}`}
                      target="_blank"
                    >
                      <img className="nftImage" src={imageWithGateway && imageWithGateway} alt={"LF #" + id} width="100%" />
                    </a>
                    <div className="cardFooters"> {/* LMAO THIS LINE IS HOLDING EVERYTHING/*/}                                  
                      { item.nftOwner == address.toLowerCase() ? ( /// logic asking if you are the owner
                          <>
                            {item.askSeller.seller == "0x0000000000000000000000000000000000000000" ? ( /// logic asking what to do if you are the owner and ask does NOT exist
                              <div>
                                <div className="listingStatusManager">
                                  <div>
                                    <Address
                                      className="listingOwner"
                                      address={item.nftOwner}
                                      ensProvider={mainnetProvider}
                                      blockExplorer={blockExplorer}
                                      fontSize={16}
                                    />
                                  </div>
                                  <div className="listingStatus">
                                  LISTING STATUS : INACTIVE
                                  </div>
                                  <div className="listingPrice">
                                  PRICE : N/A
                                  </div>
                                  <div className="listingFindersFee">
                                  FINDER'S FEE : N/A
                                  </div>
                                </div>                                
                                { erc721TransferHelperApproved && zoraModuleManagerApproved == true ? ( 
                                <div className="marketplaceManager">                                    
                                  <Button
                                    className="marketplaceApprovalButton"
                                    disabled={true}
                                    style={{ borderRadius: 2, border: "1px solid black", width: "100%", fontSize: "1.2rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} 
                                    type="primary"
                                  >
                                    MARKETPLACE PROTOCOLS ARE APPROVED
                                  </Button>
                                  <Popover
                                  placement="top"
                                  style={{ display: "flex", flexDirection: "column", jusitfyContent: "center" }}
                                    content={() => {                                                        
                                      return createAsk(id);
                                    }}
                                  >
                                    <Button style={{ borderRadius: 2, border: "1px solid black", backgroundColor: "white", color: "#3e190f", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">LIST</Button>
                                  </Popover>
                                  <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">UPDATE</Button>
                                  <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">CANCEL</Button>
                                  <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">BUY</Button>
                                </div>  
                                ) : (
                                <div className="marketplaceManager">
                                  <Popover
                                    className="popoverMaster"
                                    placement="top"
                                    content={() => {                                                        
                                      return marketplaceManager();
                                    }}
                                  >
                                    <Button
                                      className="marketplaceApprovalButton"
                                      disabled={false}
                                      style={{ borderRadius: 2, border: "1px solid black", backgroundColor: "white", color: "#3e190f", fontSize: "1.2rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} 
                                      type="primary"
                                    >
                                      APPROVE MARKETPLACE PROTOCOLS
                                    </Button>
                                  </Popover>                                    
                                  <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">LIST</Button>
                                  <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">UPDATE</Button>
                                  <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">CANCEL</Button>
                                  <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">BUY</Button>
                                </div>
                                )}
                              </div>
                              ) : ( ///logic asking if you are the owner and the ask DOES exist
                                <div>
                                  <div className="listingStatusManager">                                 
                                    <div>
                                      <Address
                                        className="listingOwner"
                                        address={item.nftOwner}
                                        ensProvider={mainnetProvider}
                                        blockExplorer={blockExplorer}
                                        fontSize={16}
                                      />
                                    </div>                                    
                                    <div>
                                    LISTING STATUS : ACTIVE 
                                    </div>
                                    <div>                        
                                    PRICE : {item.askSeller.askPrice.toString() / (10 ** 18)} ETH
                                    </div>
                                    <div>
                                    FINDER'S FEE : {item.askSeller.findersFeeBps / 100} % 
                                    </div> 
                                  </div>
                                  { erc721TransferHelperApproved && zoraModuleManagerApproved == true ? (
                                  <div className="marketplaceManager"> 
                                    <Button
                                    className="marketplaceApprovalButton"
                                    disabled={true}
                                    style={{ borderRadius: 2, border: "1px solid black", width: "100%", fontSize: "1.2rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} 
                                    type="primary"
                                    >
                                      MARKETPLACE PROTOCOLS ARE APPROVED
                                    </Button>                                  
                                    <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">LIST</Button>                                
                                    <Popover
                                      content={() => {                                                        
                                        return updateAskPrice(id);
                                      }}
                                    >
                                      <Button style={{ borderRadius: 2, border: "1px solid black", backgroundColor: "white", color: "#3e190f", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">UPDATE</Button>
                                    </Popover>
                                    <Popover
                                      content={() => {                                                        
                                        return cancelAsk(id);
                                      }}
                                    >
                                      <Button style={{ borderRadius: 2, border: "1px solid black", backgroundColor: "white", color: "#3e190f", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">CANCEL</Button>
                                    </Popover>
                                    <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">BUY</Button>
                                  </div>
                                  ) : (
                                  <div className="marketplaceManager">
                                    <Popover
                                      className="popoverMaster"
                                      placement="top"
                                      content={() => {                                                        
                                        return marketplaceManager();
                                      }}
                                    >
                                      <Button
                                        className="marketplaceApprovalButton"
                                        disabled={false}
                                        style={{ borderRadius: 2, border: "1px solid black", backgroundColor: "white", color: "#3e190f", fontSize: "1.2rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} 
                                        type="primary"
                                      >
                                        APPROVE MARKETPLACE PROTOCOLS
                                      </Button>
                                    </Popover>
                                    <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">LIST</Button>
                                    <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">UPDATE</Button>
                                    <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">CANCEL</Button>
                                    <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">BUY</Button>                                                                         
                                  </div>
                                  )} 
                                </div>
                              )}
                          </>
                        ) : ( /// logic asking what to do if not the owner
                        <>
                          {item.askSeller.seller == "0x0000000000000000000000000000000000000000" ? (  ///logic asking what to do if not owner and ask does NOT exist
                              <div>
                                <div className="listingStatusManager">
                                  <div>
                                    <Address
                                      className="listingOwner"
                                      address={item.nftOwner}
                                      ensProvider={mainnetProvider}
                                      blockExplorer={blockExplorer}
                                      fontSize={16}
                                    />
                                  </div>
                                  <div className="listingStatus">
                                  LISTING STATUS : INACTIVE
                                  </div>
                                  <div className="listingPrice"> 
                                  PRICE : N/A
                                  </div>
                                  <div className="listingFindersFee">
                                  FINDER'S FEE : N/A
                                  </div>
                                </div>
                                <div className="marketplaceManager">
                                  <Button
                                    className="marketplaceApprovalButton"
                                    disabled={true}
                                    style={{ borderRadius: 2, border: "1px solid black", width: "100%", fontSize: "1.2rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} 
                                    type="primary"
                                  >
                                    NO AVAILABLE ACTIONS FOR THIS ITEM
                                  </Button>                                  
                                  <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">LIST</Button>
                                  <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">UPDATE</Button>
                                  <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">CANCEL</Button>
                                  <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">BUY</Button>
                                </div>                                   
                              </div>                                                   
                            ) : ( 
                              <div>
                                <div className="listingStatusManager">
                                  <div>
                                    <Address
                                      className="listingOwner"
                                      address={item.nftOwner}
                                      ensProvider={mainnetProvider}
                                      blockExplorer={blockExplorer}
                                      fontSize={16}
                                    />
                                  </div>
                                  <div className="listingStatus">
                                  LISTING STATUS : ACTIVE
                                  </div>
                                  <div className="listingPrice">                        
                                  PRICE : {item.askSeller.askPrice.toString() / (10 ** 18)} ETH
                                  </div>
                                  <div className="listingFindersFee">
                                  FINDER'S FEE : {item.askSeller.findersFeeBps / 100} % 
                                  </div>
                                </div>
                                { erc721TransferHelperApproved && zoraModuleManagerApproved == true ? (                                
                                <div className="marketplaceManager">
                                  <Button
                                    className="marketplaceApprovalButton"
                                    disabled={true}
                                    style={{ borderRadius: 2, border: "1px solid black", width: "100%", fontSize: "1.2rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} 
                                    type="primary"
                                  >
                                    MARKETPLACE PROTOCOLS ARE APPROVED
                                  </Button>                                  
                                  <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">LIST</Button>
                                  <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">UPDATE</Button>
                                  <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">CANCEL</Button>                                    
                                  <Popover
                                    className="fillAskPopver"
                                    content={() => {                                                        
                                      return fillAsk(id);
                                    }}
                                    
                                  >  
                                    <Button style={{ borderRadius: 2, border: "1px solid black", backgroundColor: "white", color: "#3e190f", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">BUY</Button>
                                  </Popover>
                                </div>
                                ) : (
                                <div className="marketplaceManager">
                                  <Popover
                                    className="popoverMaster"
                                    placement="top"
                                    content={() => {                                                        
                                      return marketplaceManager();
                                    }}
                                  >
                                    <Button
                                      className="marketplaceApprovalButton"
                                      disabled={false}
                                      style={{ borderRadius: 2, border: "1px solid black", backgroundColor: "white", color: "#3e190f", fontSize: "1.2rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} 
                                      type="primary"
                                    >
                                      APPROVE MARKETPLACE PROTOCOLS
                                    </Button>
                                  </Popover>
                                  <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">LIST</Button>
                                  <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">UPDATE</Button>
                                  <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">CANCEL</Button>
                                  <Button disabled={true} style={{ borderRadius: 2, border: "1px solid black", fontSize: "1.4rem", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }} type="primary">BUY</Button>                                                                  
                                </div>
                                )} 
                              </div>
                          )}
                          
                        </>
                      )}
                    </div>
                  </Card>
                </List.Item>
              );
            }}
          />
        </div>
      )}
    </div>
  );
}

export default OldEnglish;
