const FlaticonIcon = ({ name, type = 'sr', className = '', ...props }) => {
  return <i className={`fi fi-${type}-${name} ${className}`} {...props} />
}

export default FlaticonIcon
