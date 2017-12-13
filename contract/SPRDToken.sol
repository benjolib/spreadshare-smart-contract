pragma solidity ^0.4.10;
import "./libs/StandardToken.sol";
import "./libs/SafeMath.sol";

contract SPRDToken is StandardToken, SafeMath {

    // metadata
    string public constant name = "SpreadShare Token";
    string public constant symbol = "SPRD";
    uint256 public constant decimals = 0;
    string public version = "1.0";

    // contracts
    address public ethFundDeposit;      // deposit address for ETH
    address public sprdFoundersFundDeposit;      // deposit address for SpreadShare use
    address public sprdAppFundDeposit;      // deposit app address for SpreadShare App Fund

    // crowdsale parameters
    bool public isFinalized;            // switched to true in operational state
    uint256 public fundingStartBlock;  // start block of fund raise
    uint256 public fundingEndBlock;
    uint256 public constant sprdFoundersFund = 1 * (10**8) **decimals;   // 100M SPRD reserved for SpreadShare founders use
    uint256 public constant sprdAppFund = 2 * (10**8) **decimals;   // 100M SPRD reserved for SpreadShare founders use
    uint256 public constant tokenExchangeRate = 10000; // 10000 SPRD tokens per 1 ETH
    uint256 public constant tokenCreationCap =  7 * (10**8) **decimals;
    uint256 public constant tokenCreationMin =  7 * (10**8) **decimals;


    // events
    event LogRefund(address indexed _to, uint256 _value);
    event CreateSPRD(address indexed _to, uint256 _value);

    // constructor
    function SPRDToken(
        address _ethFundDeposit,
        address _sprdFoundersFundDeposit,
        address _sprdAppFundDeposit,
        uint256 _fundingStartBlock,
        uint256 _fundingEndBlock)
    {
      isFinalized = false;                   //controls pre through crowdsale state
      ethFundDeposit = _ethFundDeposit;
      sprdFoundersFundDeposit = _sprdFoundersFundDeposit;
      sprdAppFundDeposit = _sprdAppFundDeposit;
      fundingStartBlock = _fundingStartBlock;
      fundingEndBlock = _fundingEndBlock;
      totalSupply = safeAdd(sprdFoundersFund,sprdAppFund);
      balances[sprdFoundersFundDeposit] = sprdFoundersFund;    // `Deposit` SpreadShare founders share
      balances[sprdAppFundDeposit]      = sprdAppFund; // `Deposit` SpreadShare app share
      CreateSPRD(sprdFundDeposit, sprdFund);  // logs SpreadShare founders fund
      CreateSPRD(sprdAppFundDeposit, sprdFund);  // logs SpreadShare founders fund

    }

    /// @dev Accepts ether and creates new SPRD tokens.
    function createTokens() payable external {
      if (isFinalized) revert();
      if (block.number < fundingStartBlock) revert();
      if (block.number > fundingEndBlock) revert();
      if (msg.value == 0) revert();

      uint256 tokens = safeMult(msg.value, tokenExchangeRate); // check that we're not over totals
      uint256 checkedSupply = safeAdd(totalSupply, tokens);

      // return money if something goes wrong
      if (tokenCreationCap < checkedSupply) revert();  // odd fractions won't be found

      totalSupply = checkedSupply;
      balances[msg.sender] += tokens;  // safeAdd not needed; bad semantics to use here
      CreateSPRD(msg.sender, tokens);  // logs token creation
    }

    /// @dev Ends the funding period and sends the ETH home
    function finalize() external {
      if (isFinalized) revert();
      if (msg.sender != ethFundDeposit) revert(); // locks finalize to the ultimate ETH owner
      if(totalSupply < tokenCreationMin) revert();      // have to sell minimum to move to operational
      if(block.number <= fundingEndBlock && totalSupply != tokenCreationCap) revert();
      // move to operational
      isFinalized = true;
      if(!ethFundDeposit.send(this.balance)) revert();  // send the eth to SpreadShare
    }

    /// @dev Allows contributors to recover their ether in the case of a failed funding campaign.
    function refund() external {
      if(isFinalized) revert();                       // prevents refund if operational
      if (block.number <= fundingEndBlock) revert(); // prevents refund until sale period is over
      if(totalSupply >= tokenCreationMin) revert();  // no refunds if we sold enough
      if(msg.sender == sprdFundDeposit) revert();    // SpreadShare not entitled to a refund
      uint256 sprdVal = balances[msg.sender];
      if (sprdVal == 0) revert();
      balances[msg.sender] = 0;
      totalSupply = safeSubtract(totalSupply, sprdVal); // extra safe
      uint256 ethVal = sprdVal / tokenExchangeRate;     // should be safe; previous revert()s covers edges
      LogRefund(msg.sender, ethVal);               // log it
      if (!msg.sender.send(ethVal)) revert();       // if you're using a contract; make sure it works with .send gas limits
    }

}
