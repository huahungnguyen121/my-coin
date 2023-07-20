import { Stack, Typography } from "@mui/material";

interface PageSkeletonProps {
    title?: string;
    children?: React.ReactNode;
}

export default function PageSkeleton(props: PageSkeletonProps) {
    const { title, children } = props;
    return (
        <Stack gap={3}>
            {title && (
                <Typography variant="h4" sx={{ fontWeight: "bold", marginBottom: "1rem" }}>
                    {title}
                </Typography>
            )}
            {children}
        </Stack>
    );
}
