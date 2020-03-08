import React, {useState} from "react";

export const Legends = ({data, onChange}) => {
  const [current, setCurrent] = useState();

  return (
    <ul className="legends">
      {
        data.map(({color, name}, i) => {
          return (
            <li key={i}>
              <a
                className={`${current == name ? 'current' : ''}`}
                onClick={() => {
                  let value;
                  if ( current == name ) value = null
                  else value = name;

                  setCurrent(value);
                  if ( onChange ) onChange(value);
                  
                }}
              >
                <span className="circle" style={{background: color }}></span> 
                <p>{name}</p>
                <i className="el-icon-close"></i>
              </a>
            </li>
          )
        })
      }
    </ul>
  )
}