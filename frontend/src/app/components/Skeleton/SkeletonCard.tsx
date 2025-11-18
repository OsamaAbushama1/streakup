import React from "react";
import Skeleton from "./Skeleton";

interface SkeletonCardProps {
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showActions?: boolean;
  count?: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showImage = true,
  showTitle = true,
  showDescription = true,
  showActions = true,
  count = 1,
}) => {
  const card = (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 animate-pulse">
      {showImage && (
        <Skeleton variant="image" height={200} className="w-full mb-4" />
      )}
      {showTitle && (
        <Skeleton variant="text" width="70%" height={24} className="mb-2" />
      )}
      {showDescription && (
        <>
          <Skeleton variant="text" width="100%" height={16} className="mb-2" />
          <Skeleton variant="text" width="80%" height={16} className="mb-4" />
        </>
      )}
      {showActions && (
        <div className="flex gap-2 mt-4">
          <Skeleton variant="rectangular" width={100} height={36} />
          <Skeleton variant="rectangular" width={100} height={36} />
        </div>
      )}
    </div>
  );

  if (count > 1) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <React.Fragment key={index}>{card}</React.Fragment>
        ))}
      </div>
    );
  }

  return card;
};

export default SkeletonCard;

