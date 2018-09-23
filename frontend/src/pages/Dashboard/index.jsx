import React, { Component } from "react";

import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";

import Preferences from "../Preferences";
import Header from "../../components/Header";
import RuleCard from "../../components/RuleCard";

import styles from "./styles";
import accounts from "../../accounts";

export default class extends Component {
	constructor(props) {
		super(props);
		this.state = {
			pageView: 0
		};
	}

	goBack = () => {
		this.setState({ pageView: this.state.pageView - 1 });
	};

	goForward = () => {
		this.setState({ pageView: this.state.pageView + 1 });
	};

	selectRule = () => {
		console.log("Here");
		this.setState({ pageView: this.state.pageView + 1 });
	};

	render() {
		const { pageView } = this.state;
		return (
			<div>
				<Header
					userName={accounts[0].name}
					userKey={accounts[0].publicKey}
				/>

				{pageView === 0 && (
					<div style={styles.contentContainer}>
						<div style={styles.contentTitle}>
							Ready to Create Your First Rule?
						</div>
						<Button
							color="secondary"
							variant="contained"
							size="large"
							style={styles.orangeButton}
							onClick={this.goForward}
						>
							Get Started
						</Button>
						<Typography
							color="secondary"
							variant="body1"
							component="h2"
						>
							what is a rule?
						</Typography>
					</div>
				)}

				{pageView === 1 && (
					<div style={styles.contentContainer}>
						<div style={styles.contentTitle}>Select a Rule</div>
						<Typography
							variant="body1"
							style={styles.stepText}
							component="h2"
						>
							Step {pageView} of 3
						</Typography>
						<div style={styles.ruleCardsContainer}>
							<button
								style={styles.buttonWrapper}
								onClick={this.selectRule}
							>
								<RuleCard
									text="Spending Limit"
									icon="dollarCircle.png"
								/>
							</button>
							<button
								style={styles.buttonWrapper}
								onClick={this.selectRule}
							>
								<RuleCard
									text="Number of Transactions"
									icon="clock.png"
									onClick={this.selectRule}
								/>
							</button>
							<button
								style={styles.buttonWrapper}
								onClick={this.selectRule}
							>
								<RuleCard
									text="Whitelisted Accounts"
									icon="calendar.png"
									onClick={this.selectRule}
								/>
							</button>
							<button
								style={styles.buttonWrapper}
								onClick={this.selectRule}
							>
								<RuleCard
									text="Balance Notifications"
									icon="dollarStack.png"
									onClick={this.selectRule}
								/>
							</button>
						</div>
					</div>
				)}

				{pageView === 2 && (
					<div style={styles.contentContainer}>
						<div style={styles.contentTitle}>Set Parameters</div>
						<Typography
							variant="body1"
							style={styles.stepText}
							component="h2"
						>
							Step {pageView} of 3
						</Typography>
						<Button
							color="secondary"
							variant="contained"
							size="large"
							style={styles.orangeButton}
							onClick={this.goForward}
						>
							Set Parameter
						</Button>
					</div>
				)}

				{/*<Preferences />*/}
			</div>
		);
	}
}
