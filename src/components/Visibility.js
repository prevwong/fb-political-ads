import React, {useRef, useEffect, useState} from "react";
import { useIsVisible } from 'react-is-visible'

export const Visibility = ({children}) => {
  const nodeRef = useRef()
  const isVisible = useIsVisible(nodeRef);
  const [wasVisible, setWasVisible] = useState(false);

  useEffect(() => {
    if ( isVisible ) {
      setWasVisible(true);
    }
  }, [isVisible]);

  return (
    <div ref={nodeRef} className={`visibility ${isVisible && 'visible'} ${wasVisible && 'wasVisible'}`}>
      {children}
    </div>
  )
}