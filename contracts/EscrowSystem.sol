// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EscrowSystem {
    struct Escrow {
        address payable buyer;
        address payable seller;
        uint256 amount;
        bool isCompleted;
        bool isDisputed;
    }

    address public owner;
    uint256 public escrowCount;
    mapping(uint256 => Escrow) public escrows;
    bool private paused;

    event EscrowInitiated(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount);
    event DeliveryConfirmed(uint256 indexed escrowId);
    event DisputeInitiated(uint256 indexed escrowId);
    event RefundIssued(uint256 indexed escrowId);
    event EscrowCancelled(uint256 indexed escrowId);
    event Paused();
    event Unpaused();

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    constructor() {
        owner = msg.sender;
        escrowCount = 0;
        paused = false;
    }

    function initiateEscrow(address payable _seller) external payable whenNotPaused {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        require(_seller != address(0), "Invalid seller address");
        require(_seller != msg.sender, "Buyer and seller cannot be the same");

        escrowCount++;
        escrows[escrowCount] = Escrow({
            buyer: payable(msg.sender),
            seller: _seller,
            amount: msg.value,
            isCompleted: false,
            isDisputed: false
        });

        emit EscrowInitiated(escrowCount, msg.sender, _seller, msg.value);
    }

    function confirmDelivery(uint256 _escrowId) external whenNotPaused {
        Escrow storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.buyer, "Only buyer can confirm delivery");
        require(!escrow.isCompleted, "Escrow already completed");
        require(!escrow.isDisputed, "Escrow is in dispute");

        escrow.isCompleted = true;
        (bool success, ) = escrow.seller.call{value: escrow.amount}("");
        require(success, "Transfer to seller failed");

        emit DeliveryConfirmed(_escrowId);
    }

    function initiateDispute(uint256 _escrowId) external whenNotPaused {
        Escrow storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.buyer || msg.sender == escrow.seller, "Only buyer or seller can initiate dispute");
        require(!escrow.isCompleted, "Escrow already completed");
        require(!escrow.isDisputed, "Escrow is already in dispute");

        escrow.isDisputed = true;

        emit DisputeInitiated(_escrowId);
    }

    function resolveDispute(uint256 _escrowId, address payable _recipient) external onlyOwner {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.isDisputed, "Escrow is not in dispute");
        require(!escrow.isCompleted, "Escrow already completed");
        require(_recipient == escrow.buyer || _recipient == escrow.seller, "Invalid recipient");

        escrow.isCompleted = true;
        (bool success, ) = _recipient.call{value: escrow.amount}("");
        require(success, "Transfer to recipient failed");

        emit RefundIssued(_escrowId);
    }

    function cancelEscrow(uint256 _escrowId) external {
        Escrow storage escrow = escrows[_escrowId];
        require(msg.sender == escrow.buyer, "Only buyer can cancel escrow");
        require(!escrow.isCompleted, "Escrow already completed");
        require(!escrow.isDisputed, "Escrow is in dispute");

        escrow.isCompleted = true;
        (bool success, ) = escrow.buyer.call{value: escrow.amount}("");
        require(success, "Transfer to buyer failed");

        emit EscrowCancelled(_escrowId);
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused();
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused();
    }
}
