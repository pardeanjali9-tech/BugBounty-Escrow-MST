// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title BugBountyEscrow
 * @author VEIL Protocol
 * @notice Privacy-first Bug Bounty Escrow for MST Coral Testnet.
 * @dev Manages programs, escrowed native testnet funds, cryptographic report commitments,
 *      authorized review state machine, and pull-payment reward claims.
 *      Never stores vulnerability plaintext or decryption keys on-chain.
 */
contract BugBountyEscrow {
    // -------------------------------------------------------------
    // ENUMS & CUSTOM ERRORS
    // -------------------------------------------------------------

    enum Severity {
        Low,
        Medium,
        High,
        Critical
    }

    enum ReportStatus {
        Submitted,
        UnderReview,
        Approved,
        Rejected,
        Appealed,
        Claimed
    }

    error Unauthorized();
    error ProgramNotFound();
    error ProgramNotActive();
    error ReportNotFound();
    error InvalidStateTransition();
    error InvalidRewardAmount();
    error InsufficientEscrowFunds();
    error AppealsNotAllowed();
    error InvalidCommitment();
    error EmptyStorageReference();
    error TransferFailed();
    error ReentrancyGuardReentrantCall();

    // -------------------------------------------------------------
    // REENTRANCY GUARD
    // -------------------------------------------------------------

    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;

    modifier nonReentrant() {
        if (_status == _ENTERED) revert ReentrancyGuardReentrantCall();
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    // -------------------------------------------------------------
    // DATA STRUCTURES
    // -------------------------------------------------------------

    struct Program {
        uint256 id;
        address owner;
        string title;
        string description;
        uint256 minReward;
        uint256 maxReward;
        bool allowsAppeal;
        bool active;
        uint256 totalFunded;
        uint256 reservedRewards;
        uint256 paidRewards;
        uint256 createdAt;
    }

    struct Report {
        uint256 id;
        uint256 programId;
        address researcher;
        bytes32 commitment;
        string encryptedReportRef;
        Severity severity;
        ReportStatus status;
        uint256 submittedAt;
        uint256 reviewedAt;
        address reviewer;
        uint256 approvedReward;
        string rejectionReason;
        string appealRef;
    }

    // -------------------------------------------------------------
    // STATE VARIABLES
    // -------------------------------------------------------------

    uint256 private _programCounter;
    uint256 private _reportCounter;

    mapping(uint256 => Program) private _programs;
    mapping(uint256 => mapping(address => bool)) private _programReviewers;
    mapping(uint256 => Report) private _reports;

    mapping(uint256 => uint256[]) private _programReportIds;
    mapping(address => uint256[]) private _researcherReportIds;

    // -------------------------------------------------------------
    // EVENTS
    // -------------------------------------------------------------

    event ProgramCreated(
        uint256 indexed programId,
        address indexed owner,
        string title,
        uint256 minReward,
        uint256 maxReward,
        bool allowsAppeal,
        uint256 initialDeposit
    );

    event ProgramFunded(
        uint256 indexed programId,
        address indexed funder,
        uint256 amount,
        uint256 newTotalFunded
    );

    event ReviewerUpdated(
        uint256 indexed programId,
        address indexed reviewer,
        bool authorized
    );

    event ProgramClosed(uint256 indexed programId, address indexed owner);

    event FundsWithdrawn(
        uint256 indexed programId,
        address indexed owner,
        uint256 amount,
        uint256 remainingFunds
    );

    event ReportSubmitted(
        uint256 indexed reportId,
        uint256 indexed programId,
        address indexed researcher,
        bytes32 commitment,
        string encryptedReportRef,
        Severity severity,
        uint256 timestamp
    );

    event ReportReviewStarted(
        uint256 indexed reportId,
        address indexed reviewer,
        uint256 timestamp
    );

    event ReportApproved(
        uint256 indexed reportId,
        address indexed reviewer,
        uint256 rewardAmount,
        uint256 timestamp
    );

    event ReportRejected(
        uint256 indexed reportId,
        address indexed reviewer,
        string reason,
        uint256 timestamp
    );

    event ReportAppealed(
        uint256 indexed reportId,
        address indexed researcher,
        string appealRef,
        uint256 timestamp
    );

    event RewardClaimed(
        uint256 indexed reportId,
        address indexed researcher,
        uint256 amount,
        uint256 timestamp
    );

    // -------------------------------------------------------------
    // MODIFIERS
    // -------------------------------------------------------------

    modifier onlyProgramOwner(uint256 programId) {
        if (_programs[programId].owner == address(0)) revert ProgramNotFound();
        if (_programs[programId].owner != msg.sender) revert Unauthorized();
        _;
    }

    modifier onlyAuthorizedReviewer(uint256 programId) {
        Program storage program = _programs[programId];
        if (program.owner == address(0)) revert ProgramNotFound();
        if (msg.sender != program.owner && !_programReviewers[programId][msg.sender]) {
            revert Unauthorized();
        }
        _;
    }

    // -------------------------------------------------------------
    // PROGRAM MANAGEMENT
    // -------------------------------------------------------------

    /**
     * @notice Creates a new bounty program with specified parameters.
     * @param title Title of the bounty program
     * @param description Brief description or scope
     * @param minReward Minimum reward threshold in native testnet wei
     * @param maxReward Maximum reward ceiling in native testnet wei
     * @param allowsAppeal Whether rejected submissions can be appealed
     */
    function createProgram(
        string memory title,
        string memory description,
        uint256 minReward,
        uint256 maxReward,
        bool allowsAppeal
    ) external payable returns (uint256) {
        if (bytes(title).length == 0) revert InvalidRewardAmount();
        if (minReward > maxReward) revert InvalidRewardAmount();

        _programCounter++;
        uint256 programId = _programCounter;

        Program storage program = _programs[programId];
        program.id = programId;
        program.owner = msg.sender;
        program.title = title;
        program.description = description;
        program.minReward = minReward;
        program.maxReward = maxReward;
        program.allowsAppeal = allowsAppeal;
        program.active = true;
        program.totalFunded = msg.value;
        program.reservedRewards = 0;
        program.paidRewards = 0;
        program.createdAt = block.timestamp;

        // The creator is by default an authorized reviewer
        _programReviewers[programId][msg.sender] = true;

        emit ProgramCreated(
            programId,
            msg.sender,
            title,
            minReward,
            maxReward,
            allowsAppeal,
            msg.value
        );

        if (msg.value > 0) {
            emit ProgramFunded(programId, msg.sender, msg.value, msg.value);
        }

        return programId;
    }

    /**
     * @notice Deposits native Coral testnet currency into the program escrow.
     * @param programId ID of the program to fund
     */
    function fundProgram(uint256 programId) external payable {
        Program storage program = _programs[programId];
        if (program.owner == address(0)) revert ProgramNotFound();
        if (!program.active) revert ProgramNotActive();
        if (msg.value == 0) revert InvalidRewardAmount();

        program.totalFunded += msg.value;

        emit ProgramFunded(programId, msg.sender, msg.value, program.totalFunded);
    }

    /**
     * @notice Grants or revokes reviewer authorization for a given program.
     */
    function setReviewer(
        uint256 programId,
        address reviewer,
        bool authorized
    ) external onlyProgramOwner(programId) {
        if (reviewer == address(0)) revert Unauthorized();
        _programReviewers[programId][reviewer] = authorized;
        emit ReviewerUpdated(programId, reviewer, authorized);
    }

    /**
     * @notice Deactivates a program so no new submissions can be made.
     */
    function closeProgram(uint256 programId) external onlyProgramOwner(programId) {
        Program storage program = _programs[programId];
        if (!program.active) revert ProgramNotActive();

        program.active = false;
        emit ProgramClosed(programId, msg.sender);
    }

    /**
     * @notice Withdraws unreserved funds from escrow.
     * @dev Never permits withdrawing reserved rewards owed to researchers.
     */
    function withdrawUnreservedFunds(
        uint256 programId,
        uint256 amount
    ) external onlyProgramOwner(programId) nonReentrant {
        Program storage program = _programs[programId];
        uint256 available = program.totalFunded - program.reservedRewards - program.paidRewards;

        if (amount == 0 || amount > available) revert InsufficientEscrowFunds();

        program.totalFunded -= amount;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        if (!sent) revert TransferFailed();

        emit FundsWithdrawn(
            programId,
            msg.sender,
            amount,
            program.totalFunded - program.reservedRewards - program.paidRewards
        );
    }

    // -------------------------------------------------------------
    // REPORT MANAGEMENT & STATE MACHINE
    // -------------------------------------------------------------

    /**
     * @notice Submits a cryptographic commitment and encrypted payload reference.
     * @param programId Program ID
     * @param commitment Keccak-256 / SHA-256 commitment of the canonical report + nonce
     * @param encryptedReportRef Decentralized or private storage identifier (e.g. backend storage ref / CID)
     * @param severity Vulnerability severity level
     */
    function submitReport(
        uint256 programId,
        bytes32 commitment,
        string memory encryptedReportRef,
        Severity severity
    ) external returns (uint256) {
        Program storage program = _programs[programId];
        if (program.owner == address(0)) revert ProgramNotFound();
        if (!program.active) revert ProgramNotActive();
        if (commitment == bytes32(0)) revert InvalidCommitment();
        if (bytes(encryptedReportRef).length == 0) revert EmptyStorageReference();

        _reportCounter++;
        uint256 reportId = _reportCounter;

        Report storage report = _reports[reportId];
        report.id = reportId;
        report.programId = programId;
        report.researcher = msg.sender;
        report.commitment = commitment;
        report.encryptedReportRef = encryptedReportRef;
        report.severity = severity;
        report.status = ReportStatus.Submitted;
        report.submittedAt = block.timestamp;

        _programReportIds[programId].push(reportId);
        _researcherReportIds[msg.sender].push(reportId);

        emit ReportSubmitted(
            reportId,
            programId,
            msg.sender,
            commitment,
            encryptedReportRef,
            severity,
            block.timestamp
        );

        return reportId;
    }

    /**
     * @notice Transitions a report to UnderReview by an authorized reviewer.
     */
    function startReview(uint256 reportId) external {
        Report storage report = _reports[reportId];
        if (report.id == 0) revert ReportNotFound();

        Program storage program = _programs[report.programId];
        if (msg.sender != program.owner && !_programReviewers[report.programId][msg.sender]) {
            revert Unauthorized();
        }

        if (
            report.status != ReportStatus.Submitted &&
            report.status != ReportStatus.Appealed
        ) {
            revert InvalidStateTransition();
        }

        report.status = ReportStatus.UnderReview;
        report.reviewer = msg.sender;
        report.reviewedAt = block.timestamp;

        emit ReportReviewStarted(reportId, msg.sender, block.timestamp);
    }

    /**
     * @notice Approves a report and locks the reward from available escrow funds.
     */
    function approveReport(
        uint256 reportId,
        uint256 rewardAmount
    ) external nonReentrant {
        Report storage report = _reports[reportId];
        if (report.id == 0) revert ReportNotFound();

        Program storage program = _programs[report.programId];
        if (msg.sender != program.owner && !_programReviewers[report.programId][msg.sender]) {
            revert Unauthorized();
        }

        if (report.status != ReportStatus.UnderReview) {
            revert InvalidStateTransition();
        }

        if (rewardAmount < program.minReward || rewardAmount > program.maxReward) {
            revert InvalidRewardAmount();
        }

        uint256 available = program.totalFunded - program.reservedRewards - program.paidRewards;
        if (rewardAmount > available) {
            revert InsufficientEscrowFunds();
        }

        // Checks-Effects
        program.reservedRewards += rewardAmount;
        report.status = ReportStatus.Approved;
        report.approvedReward = rewardAmount;
        report.reviewer = msg.sender;
        report.reviewedAt = block.timestamp;

        emit ReportApproved(reportId, msg.sender, rewardAmount, block.timestamp);
    }

    /**
     * @notice Rejects a report with a documented reason.
     */
    function rejectReport(
        uint256 reportId,
        string memory reason
    ) external {
        Report storage report = _reports[reportId];
        if (report.id == 0) revert ReportNotFound();

        Program storage program = _programs[report.programId];
        if (msg.sender != program.owner && !_programReviewers[report.programId][msg.sender]) {
            revert Unauthorized();
        }

        if (report.status != ReportStatus.UnderReview) {
            revert InvalidStateTransition();
        }

        report.status = ReportStatus.Rejected;
        report.rejectionReason = reason;
        report.reviewer = msg.sender;
        report.reviewedAt = block.timestamp;

        emit ReportRejected(reportId, msg.sender, reason, block.timestamp);
    }

    /**
     * @notice Researcher appeals an eligible rejected report.
     */
    function appealReport(
        uint256 reportId,
        string memory appealRef
    ) external {
        Report storage report = _reports[reportId];
        if (report.id == 0) revert ReportNotFound();
        if (report.researcher != msg.sender) revert Unauthorized();

        Program storage program = _programs[report.programId];
        if (!program.allowsAppeal) revert AppealsNotAllowed();

        if (report.status != ReportStatus.Rejected) {
            revert InvalidStateTransition();
        }

        report.status = ReportStatus.Appealed;
        report.appealRef = appealRef;

        emit ReportAppealed(reportId, msg.sender, appealRef, block.timestamp);
    }

    /**
     * @notice Researcher claims an approved reward via pull-payment.
     */
    function claimReward(uint256 reportId) external nonReentrant {
        Report storage report = _reports[reportId];
        if (report.id == 0) revert ReportNotFound();
        if (report.researcher != msg.sender) revert Unauthorized();

        if (report.status != ReportStatus.Approved) {
            revert InvalidStateTransition();
        }

        uint256 reward = report.approvedReward;
        if (reward == 0) revert InvalidRewardAmount();

        Program storage program = _programs[report.programId];

        // Checks-Effects
        report.status = ReportStatus.Claimed;
        program.reservedRewards -= reward;
        program.paidRewards += reward;

        // Interaction
        (bool sent, ) = payable(msg.sender).call{value: reward}("");
        if (!sent) revert TransferFailed();

        emit RewardClaimed(reportId, msg.sender, reward, block.timestamp);
    }

    // -------------------------------------------------------------
    // VIEW FUNCTIONS
    // -------------------------------------------------------------

    function getProgram(uint256 programId) external view returns (Program memory) {
        if (_programs[programId].owner == address(0)) revert ProgramNotFound();
        return _programs[programId];
    }

    function getProgramCount() external view returns (uint256) {
        return _programCounter;
    }

    function getReport(uint256 reportId) external view returns (Report memory) {
        if (_reports[reportId].id == 0) revert ReportNotFound();
        return _reports[reportId];
    }

    function getReportCount() external view returns (uint256) {
        return _reportCounter;
    }

    function getAvailableFunds(uint256 programId) external view returns (uint256) {
        Program storage program = _programs[programId];
        if (program.owner == address(0)) revert ProgramNotFound();
        return program.totalFunded - program.reservedRewards - program.paidRewards;
    }

    function isReviewer(uint256 programId, address reviewer) external view returns (bool) {
        return _programReviewers[programId][reviewer] || _programs[programId].owner == reviewer;
    }

    function getProgramReports(uint256 programId) external view returns (uint256[] memory) {
        return _programReportIds[programId];
    }

    function getResearcherReports(address researcher) external view returns (uint256[] memory) {
        return _researcherReportIds[researcher];
    }
}

