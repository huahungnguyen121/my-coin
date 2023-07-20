import { Stack, Step, StepLabel, Stepper } from "@mui/material";
import PageSkeleton from "../../../components/page-skeleton";
import { useState } from "react";
import { Step1, Step2 } from "./components/steps";

const steps = ["Get your key", "Well done"];

export default function CreateWallet() {
    const [activeStep, setActiveStep] = useState(0);

    const changeStep = (next: boolean = true) => {
        if (next) {
            if (activeStep >= steps.length - 1) return;
            setActiveStep((prev) => ++prev);
            return;
        }

        if (activeStep <= 0) return;
        setActiveStep((prev) => --prev);
    };

    const renderStep = () => {
        switch (activeStep) {
            case 0: {
                return <Step1 goBack={() => changeStep(false)} toNextStep={() => changeStep()} />;
            }

            case 1: {
                return <Step2 goBack={() => changeStep(false)} toNextStep={() => changeStep()} />;
            }
        }
    };

    return (
        <PageSkeleton title="Create Wallet">
            <Stack gap={3}>
                <Stepper activeStep={activeStep}>
                    {steps.map((label, index) => {
                        const stepProps: { completed?: boolean } = {};
                        if (index < activeStep) stepProps.completed = true;
                        return (
                            <Step key={label} {...stepProps}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>

                {renderStep()}
            </Stack>
        </PageSkeleton>
    );
}
