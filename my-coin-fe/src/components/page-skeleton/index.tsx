interface PageSkeletonProps {
    children?: React.ReactNode;
}

export default function PageSkeleton(props: PageSkeletonProps) {
    const { children } = props;
    return <div>{children}</div>;
}
