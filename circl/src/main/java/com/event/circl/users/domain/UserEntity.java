package com.event.circl.users.domain;

import com.event.circl.shared.domain.BaseEntity;
import com.event.circl.shared.utils.AssertUtil;
import com.event.circl.users.domain.models.UserId;
import com.event.circl.users.domain.models.UserRole;
import jakarta.persistence.*;

@Entity
@Table(name = "users")
class UserEntity extends BaseEntity {

    @EmbeddedId
    @AttributeOverride(name = "id", column = @Column(name = "id", nullable = false))
    private UserId id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private UserRole role;

    protected UserEntity() {}

    UserEntity(UserId id, String firstName, String lastName, String email, String password, UserRole role) {
        this.id = AssertUtil.requireNotNull(id, "User id cannot be null");
        this.firstName = AssertUtil.requireNotBlank(firstName, "First name cannot be blank");
        this.lastName = AssertUtil.requireNotBlank(lastName, "Last name cannot be blank");
        this.email = AssertUtil.requireNotBlank(email, "Email cannot be blank");
        this.password = AssertUtil.requireNotBlank(password, "Password cannot be blank");
        this.role = AssertUtil.requireNotNull(role, "Role cannot be null");
    }

    static UserEntity create(String firstName, String lastName, String email, String password, UserRole role) {
        return new UserEntity(UserId.generate(), firstName, lastName, email, password, role);
    }

    UserId getId() { return id; }
    String getFirstName() { return firstName; }
    String getLastName() { return lastName; }
    String getEmail() { return email; }
    String getPassword() { return password; }
    UserRole getRole() { return role; }
    String getFullName() { return firstName + " " + lastName; }
}
