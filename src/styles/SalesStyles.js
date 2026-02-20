export const colors = { 
    green: "#6B7C65", 
    beige: "#E8DCC6", 
    purple: "#7D4E99", 
    darkGreen: "#4A5D4B", 
    red: "#D9534F", 
    blue: "#337AB7", 
    yellow: "#D4AF37" 
}

export const btnStyle = { 
    padding: "8px 16px", 
    borderRadius: "5px", 
    border: "none", 
    cursor: "pointer", 
    fontWeight: "bold", 
    color: "white", 
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)" 
}

export const cardStyle = { 
    flex: 1, 
    padding: "20px", 
    borderRadius: "10px", 
    textAlign: "center", 
    color: "white" 
}

export const inputStyle = { 
    padding: "5px 10px", 
    borderRadius: "5px", 
    border: "1px solid #ccc", 
    fontSize: "12px", 
    marginRight: "5px" 
}

export const formInput = { 
    width: "100%", 
    padding: "10px", 
    margin: "5px 0 15px", 
    borderRadius: "5px", 
    border: "1px solid #ccc" 
}

export const modalOverlay = { 
    position: "fixed", 
    top: 0, 
    left: 0, 
    width: "100%", 
    height: "100%", 
    background: "rgba(0,0,0,0.5)", 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
    zIndex: 1000 
}

export const modalContent = { 
    background: "white", 
    padding: "30px", 
    borderRadius: "15px", 
    width: "500px", 
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)", 
    position: "relative" 
}

export const confirmOverlay = { 
    ...modalOverlay, 
    zIndex: 2000 
}

export const confirmContent = { 
    ...modalContent, 
    width: "400px", 
    textAlign: "center" 
}