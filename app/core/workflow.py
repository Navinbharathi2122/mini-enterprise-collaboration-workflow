from fastapi import HTTPException, status



WORKFLOW_TRANSITIONS = {
    "todo": ["in_progress"],
    "in_progress": ["review"],
    "review": ["done"],
    "done": [],
}


def validate_workflow_transition(current_status: str, next_status: str):
    current_status = current_status.lower().strip()
    next_status = next_status.lower().strip()

   
    if current_status == next_status:
        return True

    
    allowed_status = WORKFLOW_TRANSITIONS.get(current_status, [])

    if next_status not in allowed_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid workflow transition: {current_status.upper()} → {next_status.upper()}",
        )

    return True